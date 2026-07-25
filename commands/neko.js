// commands/neko.js

const logger = require('../lib/logger');
const { getReactionImage } = require('../lib/animeApi');

module.exports = {
  name: 'neko',
  emoji: '🐱',
  category: 'anime',
  description: 'Sends a random neko (cat girl) image.',
  usage: '.neko',
  cooldown: 3,
  async execute({ sock, from }) {
    try {
      const url = await getReactionImage('neko');
      await sock.sendMessage(from, { image: { url }, caption: '🐱 Nyaa~' });
    } catch (err) {
      logger.error({ err }, 'neko command failed');
      await sock.sendMessage(from, { text: '❌ Could not fetch an image right now, try again shortly.' });
    }
  },
};
