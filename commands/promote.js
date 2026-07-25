// commands/promote.js

const { resolveTargetJid, jidToNumber } = require('../utils/helpers');
const ui = require('../utils/ui');

module.exports = {
  name: 'promote',
  emoji: '⬆️',
  category: 'admin',
  description: 'Makes a member a group admin. Usage: .promote @user (or reply to their message)',
  usage: '.promote @user',
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ sock, msg, from, args }) {
    const target = resolveTargetJid(msg, args);
    if (!target) {
      await sock.sendMessage(from, ui.info('Mention the user, reply to them, or pass their number. Usage: .promote @user'));
      return;
    }

    try {
      await sock.groupParticipantsUpdate(from, [target], 'promote');
      await sock.sendMessage(from, { ...ui.success(`Promoted @${jidToNumber(target)} to admin.`), mentions: [target] });
    } catch (err) {
      await sock.sendMessage(from, ui.fail(`Failed to promote that member: ${err.message}`));
    }
  },
};
