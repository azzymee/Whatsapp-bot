// commands/translate.js
// Usage: .translate <lang_code> <text>
// Or reply to a message with: .translate <lang_code>

const { translateText } = require('../lib/translate');
const { extractMessageText } = require('../utils/helpers');

module.exports = {
  name: 'translate',
  emoji: '🌐',
  aliases: ['tr'],
  category: 'utility',
  description: 'Translates text. Usage: .translate <lang_code> <text> (or reply to a message)',
  usage: '.translate <lang_code> <text>',
  async execute({ sock, msg, from, args, prefix }) {
    if (!args[0]) {
      await sock.sendMessage(from, {
        text:
          `Usage: ${prefix}translate <lang_code> <text>\n` +
          `Example: ${prefix}translate es Good morning\n` +
          `You can also reply to a message with ${prefix}translate <lang_code>`,
      });
      return;
    }

    const targetLang = args[0];
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = args.slice(1).join(' ') || (quoted ? extractMessageText(quoted) : '');

    if (!text) {
      await sock.sendMessage(from, {
        text: `Provide text to translate, or reply to a message.\nUsage: ${prefix}translate <lang_code> <text>`,
      });
      return;
    }

    try {
      const { translated, detectedSourceLang } = await translateText(text, targetLang);
      await sock.sendMessage(from, {
        text: `🌐 *${detectedSourceLang} ➜ ${targetLang}*\n\n${translated}`,
      });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Translation failed: ${err.message}` });
    }
  },
};
