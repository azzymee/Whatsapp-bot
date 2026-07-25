// utils/helpers.js
// Small shared helper functions used across commands and events.

const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const config = require('../config/config');

// Matches plain URLs and WhatsApp group invite links.
const LINK_REGEX = /(https?:\/\/[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)|(wa\.me\/[^\s]+)/i;

/**
 * Returns the matched prefix if the text starts with one of the
 * configured prefixes, otherwise null.
 */
function getUsedPrefix(text) {
  if (!text) return null;
  return config.prefixes.find((p) => text.startsWith(p)) || null;
}

/**
 * Splits raw message text into { command, args, text } after stripping
 * the prefix. Returns null if the text does not start with any prefix.
 */
function parseCommand(rawText) {
  const prefix = getUsedPrefix(rawText);
  if (!prefix) return null;

  const withoutPrefix = rawText.slice(prefix.length).trim();
  if (!withoutPrefix) return null;

  const [command, ...args] = withoutPrefix.split(/\s+/);
  return {
    prefix,
    command: command.toLowerCase(),
    args,
    text: args.join(' '),
  };
}

/**
 * Extracts the plain text body from any supported message type.
 */
function extractMessageText(message) {
  if (!message) return '';
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ''
  );
}

/**
 * Normalizes a WhatsApp JID down to a bare phone number string.
 */
function jidToNumber(jid) {
  if (!jid) return '';
  return jid.split('@')[0].split(':')[0];
}

/**
 * Checks whether a given JID belongs to a configured bot owner.
 */
function isOwner(jid) {
  const number = jidToNumber(jid);
  return config.ownerNumbers.includes(number);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true if the text contains a URL or a WhatsApp invite link.
 */
function containsLink(text) {
  if (!text) return false;
  return LINK_REGEX.test(text);
}

/**
 * Fetches group metadata and returns a Set of every JID/LID string that
 * currently identifies an admin/superadmin in the group. WhatsApp's
 * "LID" rollout means a participant can appear as either an
 * "@s.whatsapp.net" JID or an "@lid" identifier depending on the
 * group/account — sometimes even for the bot's own account — so both
 * are collected and matched against, instead of assuming one canonical
 * form.
 */
async function getGroupAdmins(sock, groupId) {
  const metadata = await sock.groupMetadata(groupId);
  const admins = new Set();

  for (const p of metadata.participants) {
    if (p.admin !== 'admin' && p.admin !== 'superadmin') continue;
    if (p.id) admins.add(jidNormalizedUser(p.id));
    if (p.jid) admins.add(jidNormalizedUser(p.jid));
    if (p.lid) admins.add(jidNormalizedUser(p.lid));
  }

  return admins;
}

/**
 * Checks whether the given JID is an admin/superadmin of the group.
 */
async function isGroupAdmin(sock, groupId, jid) {
  const admins = await getGroupAdmins(sock, groupId);
  return admins.has(jidNormalizedUser(jid));
}

/**
 * Checks whether the bot itself currently has admin rights in the group.
 * Most moderation actions (delete, kick, promote, demote) fail silently
 * without this.
 *
 * Checks both sock.user.id and sock.user.lid (when Baileys exposes it)
 * against the admin set, since WhatsApp may be listing the bot's own
 * participant entry under either identifier — see the note on
 * getGroupAdmins() above.
 */
async function isBotAdmin(sock, groupId) {
  const admins = await getGroupAdmins(sock, groupId);
  const candidates = [sock.user?.id, sock.user?.lid].filter(Boolean);
  return candidates.some((jid) => admins.has(jidNormalizedUser(jid)));
}

/**
 * True if either the sender is a group admin or a configured bot owner.
 * Used to exempt privileged users from anti-link/anti-spam enforcement.
 */
async function isPrivileged(sock, groupId, jid) {
  if (isOwner(jid)) return true;
  if (!groupId?.endsWith('@g.us')) return false;
  return isGroupAdmin(sock, groupId, jid);
}

/**
 * Resolves the JID a command like .kick/.promote/.demote/.mute is
 * targeting: an @mention, a replied-to (quoted) message's author, or a
 * bare phone number passed as the first argument. Returns null if none
 * of those are present.
 */
function resolveTargetJid(msg, args) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentioned && mentioned.length > 0) return jidNormalizedUser(mentioned[0]);

  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (quotedParticipant) return jidNormalizedUser(quotedParticipant);

  const firstArg = args?.[0];
  if (firstArg) {
    const digits = firstArg.replace(/[^0-9]/g, '');
    if (digits) return `${digits}@s.whatsapp.net`;
  }

  return null;
}

/**
 * Resolves the media message a command like .sticker/.toimg should act
 * on: the quoted (replied-to) message if it has one of the allowed
 * media types, otherwise the command message itself. Returns a
 * Baileys-shaped { key, message } object suitable for passing straight
 * into downloadMediaMessage(), or null if nothing usable was found.
 */
function getQuotedOrDirectMessage(msg, allowedTypes) {
  const context = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = context?.quotedMessage;

  if (quoted && allowedTypes.some((t) => quoted[t])) {
    return {
      key: {
        remoteJid: msg.key.remoteJid,
        id: context.stanzaId,
        participant: context.participant,
      },
      message: quoted,
    };
  }

  if (msg.message && allowedTypes.some((t) => msg.message[t])) {
    return { key: msg.key, message: msg.message };
  }

  return null;
}

module.exports = {
  getUsedPrefix,
  parseCommand,
  extractMessageText,
  jidToNumber,
  isOwner,
  sleep,
  containsLink,
  getGroupAdmins,
  isGroupAdmin,
  isBotAdmin,
  isPrivileged,
  resolveTargetJid,
  getQuotedOrDirectMessage,
};
