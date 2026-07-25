// commands/kiss.js

const logger = require('../lib/logger');
const { getReactionImage } = require('../lib/animeApi');
const { resolveTargetJid, jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'kiss',
  emoji: '😘',
  category: 'anime',
  description: 'Kisses a mentioned user (or just sends a kiss gif). Usage: .kiss [@user]',
  usage: '.kiss [@user]',
  cooldown: 3,
  async execute({ sock, msg, from, sender, args }) {
    const target = resolveTargetJid(msg, args);
    try {
      const url = await getReactionImage('kiss');
      const caption = target
        ? `😘 @${jidToNumber(sender)} kisses @${jidToNumber(target)}!`
        : '😘 *muah*';
      await sock.sendMessage(from, {
        image: { url },
        caption,
        mentions: target ? [sender, target] : [],
      });
    } catch (err) {
      logger.error({ err }, 'kiss command failed');
      await sock.sendMessage(from, { text: '❌ Could not fetch an image right now, try again shortly.' });
    }
  },
};
