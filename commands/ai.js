// commands/ai.js
// Chat with Gemini. Keeps a short rolling memory per chat (see lib/ai.js)
// so follow-up questions stay contextual. ".aireset" clears that memory.

const { askGemini } = require('../lib/ai');
const ui = require('../utils/ui');

module.exports = {
  name: 'ai',
  emoji: '💬',
  aliases: ['gemini', 'ask', 'gpt'],
  category: 'ai',
  description: 'Chat with the AI. Usage: .ai <your message>',
  usage: '.ai <your message>',
  async execute({ sock, from, text, prefix }) {
    if (!text) {
      await sock.sendMessage(from, ui.usage(prefix, module.exports, 'explain event loops in node.js'));
      return;
    }

    // No manual sendPresenceUpdate here — the command handler already
    // shows "typing…" for every command unless it opts out.
    try {
      const reply = await askGemini(from, text);
      await sock.sendMessage(from, { text: reply });
    } catch (err) {
      await sock.sendMessage(from, ui.warn(err.message));
    }
  },
};

