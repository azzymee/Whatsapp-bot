// commands/hug.js

const logger = require('../lib/logger');
const { getReactionImage } = require('../lib/animeApi');
const { resolveTargetJid, jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'hug',
  emoji: '🤗',
  category: 'anime',
  description: 'Hugs a mentioned user (or just sends a hug gif). Usage: .hug [@user]',
  usage: '.hug [@user]',
  cooldown: 3,
  async execute({ sock, msg, from, sender, args }) {
    const target = resolveTargetJid(msg, args);
    try {
      const url = await getReactionImage('hug');
      const caption = target
        ? `🤗 @${jidToNumber(sender)} hugs @${jidToNumber(target)}!`
        : '🤗 *hugs*';
      await sock.sendMessage(from, {
        image: { url },
        caption,
        mentions: target ? [sender, target] : [],
      });
    } catch (err) {
      logger.error({ err }, 'hug command failed');
      await sock.sendMessage(from, { text: '❌ Could not fetch an image right now, try again shortly.' });
    }
  },
};
