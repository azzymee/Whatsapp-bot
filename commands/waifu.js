// commands/waifu.js

const logger = require('../lib/logger');
const { getReactionImage } = require('../lib/animeApi');

module.exports = {
  name: 'waifu',
  emoji: '🩷',
  category: 'anime',
  description: 'Sends a random waifu image.',
  usage: '.waifu',
  cooldown: 3,
  async execute({ sock, from }) {
    try {
      const url = await getReactionImage('waifu');
      await sock.sendMessage(from, { image: { url }, caption: '🌸 Here you go!' });
    } catch (err) {
      logger.error({ err }, 'waifu command failed');
      await sock.sendMessage(from, { text: '❌ Could not fetch an image right now, try again shortly.' });
    }
  },
};
