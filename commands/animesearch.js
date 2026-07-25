// commands/animesearch.js

const logger = require('../lib/logger');
const { searchAnime } = require('../lib/animeApi');

module.exports = {
  name: 'animesearch',
  emoji: '🔍',
  aliases: ['anime'],
  category: 'anime',
  description: 'Looks up an anime by title. Usage: .anime <title>',
  usage: '.anime <title>',
  cooldown: 5,
  async execute({ sock, from, text, prefix }) {
    if (!text) {
      await sock.sendMessage(from, { text: `Usage: ${prefix}anime <title>` });
      return;
    }

    try {
      const result = await searchAnime(text);
      if (!result) {
        await sock.sendMessage(from, { text: `No anime found for "${text}".` });
        return;
      }

      const caption =
        `🎬 *${result.title}*${result.titleEnglish ? ` (${result.titleEnglish})` : ''}\n\n` +
        `Type: ${result.type}\n` +
        `Episodes: ${result.episodes}\n` +
        `Status: ${result.status}\n` +
        `Score: ${result.score}\n\n` +
        `${result.synopsis.slice(0, 500)}${result.synopsis.length > 500 ? '...' : ''}\n\n` +
        `🔗 ${result.url}`;

      if (result.imageUrl) {
        await sock.sendMessage(from, { image: { url: result.imageUrl }, caption });
      } else {
        await sock.sendMessage(from, { text: caption });
      }
    } catch (err) {
      logger.error({ err }, 'animesearch command failed');
      await sock.sendMessage(from, { text: `❌ Search failed: ${err.message}` });
    }
  },
};
