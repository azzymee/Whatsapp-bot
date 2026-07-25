// commands/antispam.js

const spamTracker = require('../lib/spamTracker');
const { getGroupSettings, setGroupSetting } = require('../lib/settings');
const ui = require('../utils/ui');

module.exports = {
  name: 'antispam',
  emoji: '🚫',
  category: 'admin',
  description: 'Toggle flood/spam protection. Usage: .antispam on|off',
  usage: '.antispam on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, from, args }) {
    const sub = (args[0] || '').toLowerCase();
    if (sub !== 'on' && sub !== 'off') {
      const settings = getGroupSettings(from);
      await sock.sendMessage(from, ui.info(
        `Anti-spam is currently *${settings.antispam ? 'ON' : 'OFF'}*.\n` +
        `Limit: ${spamTracker.MAX_MESSAGES} messages / ${spamTracker.WINDOW_MS / 1000}s\n` +
        `Usage: .antispam on|off`
      ));
      return;
    }

    setGroupSetting(from, 'antispam', sub === 'on');
    await sock.sendMessage(from, ui.success(`Anti-spam turned ${sub}.`));
  },
};
