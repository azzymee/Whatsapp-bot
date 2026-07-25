// commands/goodbye.js -- see commands/welcome.js for the join-side equivalent.

const { getGroupSettings, setGroupSetting, DEFAULT_GOODBYE_MESSAGE } = require('../lib/settings');
const ui = require('../utils/ui');

module.exports = {
  name: 'goodbye',
  emoji: '👋',
  aliases: ['setgoodbye', 'leave'],
  category: 'admin',
  description: 'Toggle or customize the goodbye message. Usage: .goodbye on|off|set <message>',
  usage: '.goodbye on|off|set <message>',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, from, args }) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on' || sub === 'off') {
      setGroupSetting(from, 'goodbye', sub === 'on');
      await sock.sendMessage(from, ui.success(`Goodbye messages turned ${sub}.`));
      return;
    }

    if (sub === 'set') {
      const custom = args.slice(1).join(' ');
      if (!custom) {
        await sock.sendMessage(from, ui.info('Provide a message. Use @user to mention the member who left.'));
        return;
      }
      setGroupSetting(from, 'goodbyeMessage', custom);
      await sock.sendMessage(from, ui.success('Custom goodbye message saved.'));
      return;
    }

    const settings = getGroupSettings(from);
    await sock.sendMessage(from, {
      text:
        `*Goodbye settings*\n` +
        `Status: ${settings.goodbye ? 'ON' : 'OFF'}\n` +
        `Message: ${settings.goodbyeMessage || DEFAULT_GOODBYE_MESSAGE}\n\n` +
        `Usage: .goodbye on|off|set <message>`,
    });
  },
};
