// commands/antidelete.js

const { getGroupSettings, setGroupSetting } = require('../lib/settings');
const ui = require('../utils/ui');

module.exports = {
  name: 'antidelete',
  emoji: '🗑️',
  category: 'admin',
  description: 'Toggle re-posting of messages that get deleted. Usage: .antidelete on|off',
  usage: '.antidelete on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, from, args }) {
    const sub = (args[0] || '').toLowerCase();
    if (sub !== 'on' && sub !== 'off') {
      const settings = getGroupSettings(from);
      await sock.sendMessage(from, ui.info(`Anti-delete is currently *${settings.antidelete ? 'ON' : 'OFF'}*.\nUsage: .antidelete on|off`));
      return;
    }

    setGroupSetting(from, 'antidelete', sub === 'on');
    await sock.sendMessage(from, ui.success(`Anti-delete turned ${sub}.`));
  },
};
