// plugins/autoReactions.js
// Example plugin: reacts with an emoji to messages containing certain
// trigger words. Demonstrates the Plugin API (lib/pluginLoader.js) —
// specifically onMessage(ctx), which fires for every incoming message,
// command or not. Delete this file (or move it out of /plugins) to
// disable it; no other code needs to change.
//
// This is a real, working implementation of the "Auto reactions"
// feature, built entirely through the Plugin API rather than by editing
// events/index.js directly — which is the point of having a Plugin API
// at all.

// word/phrase (lowercase, matched as a substring) -> emoji reaction
const TRIGGERS = [
  { match: 'good morning', emoji: '☀️' },
  { match: 'good night', emoji: '🌙' },
  { match: 'happy birthday', emoji: '🎉' },
  { match: 'congrat', emoji: '🎊' }, // matches "congrats" and "congratulations"
  { match: 'thank you', emoji: '🙏' },
  { match: 'thanks', emoji: '🙏' },
  { match: 'lol', emoji: '😂' },
  { match: 'i love this bot', emoji: '❤️' },
];

module.exports = {
  name: 'autoReactions',
  description: 'Reacts with an emoji when a message contains certain trigger words/phrases.',

  async onMessage({ sock, msg, from, text, isCommand }) {
    // Don't react to commands, only regular chat.
    if (isCommand || !text) return;

    const lower = text.toLowerCase();
    const trigger = TRIGGERS.find((t) => lower.includes(t.match));
    if (!trigger) return;

    await sock.sendMessage(from, {
      react: { text: trigger.emoji, key: msg.key },
    });
  },
};
