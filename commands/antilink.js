// commands/antilink.js

const { getGroupSettings, setGroupSetting } = require('../lib/settings');
const ui = require('../utils/ui');

module.exports = {
  name: 'antilink',
  emoji: '🔗🚫',
  category: 'admin',
  description: 'Toggle automatic deletion of links/invite links. Usage: .antilink on|off',
  usage: '.antilink on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, from, args }) {
    const sub = (args[0] || '').toLowerCase();
    if (sub !== 'on' && sub !== 'off') {
      const settings = getGroupSettings(from);
      await sock.sendMessage(from, ui.info(`Anti-link is currently *${settings.antilink ? 'ON' : 'OFF'}*.\nUsage: .antilink on|off`));
      return;
    }

    setGroupSetting(from, 'antilink', sub === 'on');
    await sock.sendMessage(from, ui.success(`Anti-link turned ${sub}.`));
  },
};
