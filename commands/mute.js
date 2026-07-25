// commands/mute.js
// "Mutes" the group by restricting messaging to admins only (WhatsApp's
// native "announcement" group setting) - there is no per-member native
// mute in WhatsApp, so this is the closest equivalent.

const ui = require('../utils/ui');

module.exports = {
  name: 'mute',
  emoji: '🔇',
  category: 'admin',
  description: 'Restricts the group so only admins can send messages.',
  usage: '.mute',
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ sock, from }) {
    try {
      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, { text: '🔇 Group muted. Only admins can send messages now.' });
    } catch (err) {
      await sock.sendMessage(from, ui.fail(`Failed to mute the group: ${err.message}`));
    }
  },
};
