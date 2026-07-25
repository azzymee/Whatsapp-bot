// events/index.js
// Central place to wire up all Baileys events: incoming messages (command
// dispatch + anti-link/anti-spam enforcement), message deletions
// (anti-delete), and group membership changes (welcome/goodbye).
//
// This file is the single source of truth for event listeners. It is
// registered once per socket instance from lib/connection.js.

const { proto, downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('../lib/logger');
const config = require('../config/config');
const { handleMessage } = require('../lib/commandHandler');
const messageStore = require('../lib/messageStore');
const spamTracker = require('../lib/spamTracker');
const { getGroupSettings, addStrike, resetStrikes } = require('../lib/settings');
const leveling = require('../lib/leveling');
const { runOnMessage } = require('../lib/pluginLoader');
const {
  extractMessageText,
  containsLink,
  isPrivileged,
  isBotAdmin,
  jidToNumber,
  getUsedPrefix,
} = require('../utils/helpers');

const STATUS_BROADCAST_JID = 'status@broadcast';
const MEDIA_TYPES = ['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage'];

/**
 * Deletes the offending message (if the bot has admin rights), records a
 * strike against the sender, and either warns them or removes them from
 * the group once they hit the configured strike limit.
 */
async function enforceViolation(sock, groupId, sender, key, type, reasonText) {
  const botIsAdmin = await isBotAdmin(sock, groupId).catch(() => false);

  if (botIsAdmin) {
    try {
      await sock.sendMessage(groupId, { delete: key });
    } catch (err) {
      logger.error({ err }, `Failed to delete offending message for ${type}`);
    }
  }

  const strikes = addStrike(groupId, sender, type);

  if (strikes >= config.maxStrikes && botIsAdmin) {
    try {
      await sock.groupParticipantsUpdate(groupId, [sender], 'remove');
      resetStrikes(groupId, sender, type);
      await sock.sendMessage(groupId, {
        text: `🚫 @${jidToNumber(sender)} was removed for repeated ${
          type === 'antilink' ? 'link sharing' : 'spamming'
        }.`,
        mentions: [sender],
      });
    } catch (err) {
      logger.error({ err }, 'Failed to remove offending member');
    }
    return;
  }

  try {
    await sock.sendMessage(groupId, {
      text: `⚠️ @${jidToNumber(sender)}, ${reasonText} is not allowed here. Strike ${strikes}/${config.maxStrikes}.`,
      mentions: [sender],
    });
  } catch (err) {
    logger.error({ err }, 'Failed to send violation warning');
  }
}

/**
 * Runs anti-link and anti-spam checks for a group text message. Returns
 * true if the message was flagged (and therefore should NOT be passed on
 * to the command handler), false otherwise.
 */
async function moderateGroupMessage(sock, msg) {
  const groupId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const settings = getGroupSettings(groupId);

  if (!settings.antilink && !settings.antispam) return false;
  if (await isPrivileged(sock, groupId, sender)) return false;

  const text = extractMessageText(msg.message);

  if (settings.antilink && containsLink(text)) {
    await enforceViolation(sock, groupId, sender, msg.key, 'antilink', 'posting links');
    return true;
  }

  if (settings.antispam && spamTracker.recordAndCheck(groupId, sender)) {
    await enforceViolation(sock, groupId, sender, msg.key, 'antispam', 'sending messages too fast');
    return true;
  }

  return false;
}

/**
 * Handles a revoke ("delete for everyone") notification by re-sending
 * the cached original content, if anti-delete is enabled for the group
 * and the message was seen (and cached) before it was deleted.
 */
async function handleDeletion(sock, msg) {
  const chatId = msg.key.remoteJid;
  if (!chatId || !chatId.endsWith('@g.us')) return; // anti-delete covers groups only

  const settings = getGroupSettings(chatId);
  if (!settings.antidelete) return;

  const revokedKey = msg.message.protocolMessage.key;
  const cached = messageStore.get(revokedKey?.id);
  if (!cached) return; // message wasn't cached (e.g. sent before the bot started)

  const deletedBy = msg.key.participant || msg.key.remoteJid;
  const originalSender = cached.sender;
  const text = extractMessageText(cached.message);
  const mentions = [originalSender, deletedBy];

  const header =
    `🗑️ *Anti-Delete*\n` +
    `👤 Sent by: @${jidToNumber(originalSender)}\n` +
    `🧹 Deleted by: @${jidToNumber(deletedBy)}`;

  try {
    const mediaType = Object.keys(cached.message).find((k) => MEDIA_TYPES.includes(k));

    if (mediaType) {
      const buffer = await downloadMediaMessage(
        { key: cached.key, message: cached.message },
        'buffer',
        {},
        { logger, reuploadRequest: sock.updateMediaMessage }
      );
      const sendKey = mediaType.replace('Message', '');
      await sock.sendMessage(chatId, {
        [sendKey]: buffer,
        caption: text ? `${header}\n\n"${text}"` : header,
        mentions,
      });
    } else if (text) {
      await sock.sendMessage(chatId, { text: `${header}\n\n"${text}"`, mentions });
    } else {
      await sock.sendMessage(chatId, { text: header, mentions });
    }
  } catch (err) {
    logger.error({ err }, 'Failed to resend deleted message for anti-delete');
  }

  messageStore.remove(revokedKey.id);
}

/**
 * Awards message XP for a group message (leveling is scoped to group
 * activity, similar to most "server leveling" bots) and announces a
 * level-up in the chat if one happened and announcements are enabled.
 */
async function handleLevelingXp(sock, msg) {
  const groupId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  const result = leveling.awardMessageXp(sender);
  if (!result || !result.leveledUp || !config.leveling.announceLevelUp) return;

  try {
    await sock.sendMessage(groupId, {
      text: `🎉 @${jidToNumber(sender)} leveled up to *level ${result.level}*!`,
      mentions: [sender],
    });
  } catch (err) {
    logger.error({ err }, 'Failed to send level-up announcement');
  }
}

/**
 * Sends a per-participant templated message (welcome/goodbye), replacing
 * "@user" in the template with a mention for each participant. Shared by
 * both directions of group-participants.update since the only thing
 * that differs between "someone joined" and "someone left" is which
 * settings fields to read.
 */
async function announceParticipants(sock, groupId, participants, template) {
  for (const jid of participants) {
    const text = template.replace(/@user/g, `@${jidToNumber(jid)}`);
    await sock.sendMessage(groupId, { text, mentions: [jid] });
  }
}

async function handleWelcomeGoodbye(sock, { id: groupId, participants, action }) {
  try {
    const settings = getGroupSettings(groupId);

    if (action === 'add' && settings.welcome) {
      await announceParticipants(sock, groupId, participants, settings.welcomeMessage);
    } else if (action === 'remove' && settings.goodbye) {
      await announceParticipants(sock, groupId, participants, settings.goodbyeMessage);
    }
  } catch (err) {
    logger.error({ err }, 'Failed to handle group-participants.update');
  }
}

function registerEvents(sock) {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue; // empty/protocol-only messages
      if (msg.key.remoteJid === STATUS_BROADCAST_JID) continue; // status updates

      // Deletions must be handled even though they aren't "fromMe" in the
      // normal sense, so this check happens before the fromMe filter below.
      if (msg.message.protocolMessage?.type === proto.Message.ProtocolMessage.Type.REVOKE) {
        await handleDeletion(sock, msg).catch((err) =>
          logger.error({ err }, 'Unhandled error while processing a deletion')
        );
        continue;
      }

      // Cache every message we see (before the fromMe filter, so the
      // bot's own messages can also be recovered if deleted) for anti-delete.
      messageStore.save(msg);

      if (msg.key.fromMe) continue; // ignore the bot's own messages

      try {
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        if (isGroup) {
          const flagged = await moderateGroupMessage(sock, msg);
          if (flagged) continue; // don't also treat it as a command

          // Fire-and-forget: XP gain should never block/slow down normal
          // message handling below.
          handleLevelingXp(sock, msg).catch((err) =>
            logger.error({ err }, 'Unhandled error while awarding leveling XP')
          );
        }

        const text = extractMessageText(msg.message);
        const isCommand = Boolean(getUsedPrefix(text));

        // Plugins (lib/pluginLoader.js) get a look at every message,
        // command or not — this is what powers things like auto-reactions
        // without needing to touch this file for every new idea.
        runOnMessage({
          sock,
          msg,
          from: msg.key.remoteJid,
          sender: msg.key.participant || msg.key.remoteJid,
          isGroup,
          text,
          isCommand,
        }).catch((err) => logger.error({ err }, 'Unhandled error while running plugin onMessage hooks'));

        await handleMessage(sock, msg);
      } catch (err) {
        logger.error({ err }, 'Unhandled error while processing a message');
      }
    }
  });

  sock.ev.on('group-participants.update', (update) => {
    handleWelcomeGoodbye(sock, update).catch((err) =>
      logger.error({ err }, 'Unhandled error in group-participants.update')
    );
  });

  logger.info('Event listeners registered (messages, deletions, group membership)');
}

module.exports = { registerEvents };
