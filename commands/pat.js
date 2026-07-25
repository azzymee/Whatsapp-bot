// commands/pat.js

const logger = require('../lib/logger');
const { getReactionImage } = require('../lib/animeApi');
const { resolveTargetJid, jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'pat',
  emoji: '🫳',
  category: 'anime',
  description: 'Pats a mentioned user (or just sends a pat gif). Usage: .pat [@user]',
  usage: '.pat [@user]',
  cooldown: 3,
  async execute({ sock, msg, from, sender, args }) {
    const target = resolveTargetJid(msg, args);
    try {
      const url = await getReactionImage('pat');
      const caption = target
        ? `🖐️ @${jidToNumber(sender)} pats @${jidToNumber(target)}!`
        : '🖐️ *pat pat*';
      await sock.sendMessage(from, {
        image: { url },
        caption,
        mentions: target ? [sender, target] : [],
      });
    } catch (err) {
      logger.error({ err }, 'pat command failed');
      await sock.sendMessage(from, { text: '❌ Could not fetch an image right now, try again shortly.' });
    }
  },
};
