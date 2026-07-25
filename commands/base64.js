// commands/base64.js
// Encodes/decodes text as base64.

module.exports = {
  name: 'base64',
  emoji: '🔐',
  aliases: ['b64'],
  category: 'utility',
  description: 'Encodes/decodes base64. Usage: .base64 encode <text> | .base64 decode <text>',
  usage: '.base64 <encode|decode> <text>',
  async execute({ sock, from, args, prefix }) {
    const [mode, ...rest] = args;
    const text = rest.join(' ');

    if (!mode || !text || !['encode', 'decode'].includes(mode.toLowerCase())) {
      await sock.sendMessage(from, {
        text: `Usage: ${prefix}base64 encode <text>\n${prefix}base64 decode <text>`,
      });
      return;
    }

    try {
      const result =
        mode.toLowerCase() === 'encode'
          ? Buffer.from(text, 'utf-8').toString('base64')
          : Buffer.from(text, 'base64').toString('utf-8');
      await sock.sendMessage(from, { text: result });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Failed: ${err.message}` });
    }
  },
};
