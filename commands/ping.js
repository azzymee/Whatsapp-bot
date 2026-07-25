// commands/ping.js

module.exports = {
  name: 'ping',
  emoji: '🏓',
  aliases: ['p'],
  category: 'general',
  description: 'Checks whether the bot is alive and shows response time.',
  usage: '.ping',
  async execute({ sock, from }) {
    const start = Date.now();
    const sent = await sock.sendMessage(from, { text: 'Pinging...' });
    const ms = Date.now() - start;
    await sock.sendMessage(
      from,
      { text: `Pong! ${ms}ms` },
      { quoted: sent }
    );
  },
};
