// commands/richest.js

const economy = require('../lib/economy');
const { jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'richest',
  emoji: '🥇',
  aliases: ['ecoleaderboard', 'baltop'],
  category: 'economy',
  description: 'Shows the top 10 richest users bot-wide.',
  usage: '.richest',
  async execute({ sock, from }) {
    const rows = economy.getLeaderboard(10);
    if (rows.length === 0) {
      await sock.sendMessage(from, { text: 'Nobody has any coins yet. Try .daily or .work to get started!' });
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = rows.map((row, i) => {
      const medal = medals[i] || `${i + 1}.`;
      return `${medal} @${jidToNumber(row.jid)} — ${economy.formatCoins(row.total)}`;
    });

    await sock.sendMessage(from, {
      text: `💰 *Richest Users*\n\n${lines.join('\n')}`,
      mentions: rows.map((r) => r.jid),
    });
  },
};
