// commands/slap.js

const logger = require('../lib/logger');
const { getReactionImage } = require('../lib/animeApi');
const { resolveTargetJid, jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'slap',
  emoji: '👋',
  category: 'anime',
  description: 'Slaps a mentioned user (or just sends a slap gif). Usage: .slap [@user]',
  usage: '.slap [@user]',
  cooldown: 3,
  async execute({ sock, msg, from, sender, args }) {
    const target = resolveTargetJid(msg, args);
    try {
      const url = await getReactionImage('slap');
      const caption = target
        ? `👋 @${jidToNumber(sender)} slaps @${jidToNumber(target)}!`
        : '👋 *slap*';
      await sock.sendMessage(from, {
        image: { url },
        caption,
        mentions: target ? [sender, target] : [],
      });
    } catch (err) {
      logger.error({ err }, 'slap command failed');
      await sock.sendMessage(from, { text: '❌ Could not fetch an image right now, try again shortly.' });
    }
  },
};
