// commands/leaderboard.js

const leveling = require('../lib/leveling');
const { jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'leaderboard',
  emoji: '🏆',
  aliases: ['lb', 'topxp', 'ranktop'],
  category: 'leveling',
  description: 'Shows the top 10 users by level/XP bot-wide.',
  usage: '.leaderboard',
  async execute({ sock, from }) {
    const rows = leveling.getLeaderboard(10);
    if (rows.length === 0) {
      await sock.sendMessage(from, { text: 'Nobody has earned any XP yet. Start chatting to gain levels!' });
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = rows.map((row, i) => {
      const medal = medals[i] || `${i + 1}.`;
      return `${medal} @${jidToNumber(row.jid)} — Level ${row.level} (${row.xp} XP)`;
    });

    await sock.sendMessage(from, {
      text: `🏆 *XP Leaderboard*\n\n${lines.join('\n')}`,
      mentions: rows.map((r) => r.jid),
    });
  },
};
