// commands/welcome.js
// .welcome on|off             -> toggle the join message
// .welcome set <message>      -> set a custom join message (@user is replaced with a mention)
// .goodbye on|off             -> toggle the leave message
// .goodbye set <message>      -> set a custom leave message
//
// Both directions are handled by this one command so the on/off/set
// pattern only has to be implemented once; "goodbye" is registered as an
// alias-style sibling via a second exported file below is NOT possible
// (one command per file), so goodbye gets its own thin file that shares
// this same logic through a helper.

const { getGroupSettings, setGroupSetting, DEFAULT_WELCOME_MESSAGE } = require('../lib/settings');
const ui = require('../utils/ui');

module.exports = {
  name: 'welcome',
  emoji: '👋',
  aliases: ['setwelcome'],
  category: 'admin',
  description: 'Toggle or customize the welcome message. Usage: .welcome on|off|set <message>',
  usage: '.welcome on|off|set <message>',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, from, args }) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on' || sub === 'off') {
      setGroupSetting(from, 'welcome', sub === 'on');
      await sock.sendMessage(from, ui.success(`Welcome messages turned ${sub}.`));
      return;
    }

    if (sub === 'set') {
      const custom = args.slice(1).join(' ');
      if (!custom) {
        await sock.sendMessage(from, ui.info('Provide a message. Use @user to mention the new member.'));
        return;
      }
      setGroupSetting(from, 'welcomeMessage', custom);
      await sock.sendMessage(from, ui.success('Custom welcome message saved.'));
      return;
    }

    const settings = getGroupSettings(from);
    await sock.sendMessage(from, {
      text:
        `*Welcome settings*\n` +
        `Status: ${settings.welcome ? 'ON' : 'OFF'}\n` +
        `Message: ${settings.welcomeMessage || DEFAULT_WELCOME_MESSAGE}\n\n` +
        `Usage: .welcome on|off|set <message>`,
    });
  },
};
