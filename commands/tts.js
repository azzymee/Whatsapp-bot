// commands/tts.js
// Text-to-speech via Google Translate's public TTS endpoint (no key
// needed). Limited to ~200 characters per request — that's the
// endpoint's own limit, not something this bot imposes arbitrarily.

const logger = require('../lib/logger');

const MAX_CHARS = 200;
const LANG_CODE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;

module.exports = {
  name: 'tts',
  emoji: '🔊',
  category: 'utility',
  description: 'Converts text to speech. Usage: .tts [lang_code] <text>',
  usage: '.tts [lang_code] <text>',
  async execute({ sock, from, args, prefix }) {
    if (!args.length) {
      await sock.sendMessage(from, {
        text: `Usage: ${prefix}tts [lang_code] <text>\nExample: ${prefix}tts en Hello there\nMax ${MAX_CHARS} characters.`,
      });
      return;
    }

    let lang = 'en';
    let text = args.join(' ');
    if (LANG_CODE_RE.test(args[0]) && args.length > 1) {
      lang = args[0];
      text = args.slice(1).join(' ');
    }

    if (text.length > MAX_CHARS) {
      await sock.sendMessage(from, { text: `❌ Text is too long (max ${MAX_CHARS} characters).` });
      return;
    }

    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        text
      )}&tl=${lang}&client=tw-ob`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`TTS service returned HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg', ptt: true });
    } catch (err) {
      logger.error({ err }, 'tts command failed');
      await sock.sendMessage(from, { text: `❌ Failed to generate speech: ${err.message}` });
    }
  },
};
