// commands/aireset.js

const { clearHistory } = require('../lib/ai');

module.exports = {
  name: 'aireset',
  emoji: '🧹',
  aliases: ['resetai', 'clearai'],
  category: 'ai',
  description: 'Clears the AI conversation memory for this chat.',
  usage: '.aireset',
  async execute({ sock, from }) {
    clearHistory(from);
    await sock.sendMessage(from, { text: '🧹 AI conversation memory cleared for this chat.' });
  },
};
