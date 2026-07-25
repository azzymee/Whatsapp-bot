// commands/rank.js

const leveling = require('../lib/leveling');
const { jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'rank',
  emoji: '⭐',
  aliases: ['level', 'xp'],
  category: 'leveling',
  description: "Shows your (or a mentioned user's) level and XP progress.",
  usage: '.rank [@user]',
  async execute({ sock, msg, from, sender }) {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned || sender;

    const { level, xp, xpNeeded } = leveling.getRank(target);
    const barLength = 20;
    const filled = Math.round((xp / xpNeeded) * barLength);
    const bar = '▰'.repeat(filled) + '▱'.repeat(barLength - filled);

    await sock.sendMessage(
      from,
      {
        text:
          `🏆 *Rank — @${jidToNumber(target)}*\n\n` +
          `Level: ${level}\n` +
          `XP: ${xp} / ${xpNeeded}\n` +
          `${bar}`,
        mentions: [target],
      }
    );
  },
};
