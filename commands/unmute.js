// commands/unmute.js

const ui = require('../utils/ui');

module.exports = {
  name: 'unmute',
  emoji: '🔊',
  category: 'admin',
  description: 'Allows all members to send messages again.',
  usage: '.unmute',
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ sock, from }) {
    try {
      await sock.groupSettingUpdate(from, 'not_announcement');
      await sock.sendMessage(from, { text: '🔊 Group unmuted. Everyone can send messages again.' });
    } catch (err) {
      await sock.sendMessage(from, ui.fail(`Failed to unmute the group: ${err.message}`));
    }
  },
};
