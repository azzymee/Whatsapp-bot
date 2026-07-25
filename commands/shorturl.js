// commands/shorturl.js
// Shortens a URL via TinyURL's free, keyless API.

module.exports = {
  name: 'shorturl',
  emoji: '🔗',
  aliases: ['short'],
  category: 'utility',
  description: 'Shortens a URL. Usage: .shorturl <url>',
  usage: '.shorturl <url>',
  async execute({ sock, from, args, prefix }) {
    const url = args[0];
    if (!url) {
      await sock.sendMessage(from, { text: `Usage: ${prefix}shorturl <url>` });
      return;
    }

    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      const short = (await res.text()).trim();
      if (!short.startsWith('http')) {
        throw new Error(short || 'Failed to shorten that URL.');
      }
      await sock.sendMessage(from, { text: `🔗 ${short}` });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ ${err.message}` });
    }
  },
};
