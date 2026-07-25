// commands/demote.js

const { resolveTargetJid, jidToNumber } = require('../utils/helpers');
const ui = require('../utils/ui');

module.exports = {
  name: 'demote',
  emoji: '⬇️',
  category: 'admin',
  description: 'Removes admin rights from a member. Usage: .demote @user (or reply to their message)',
  usage: '.demote @user',
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ sock, msg, from, args }) {
    const target = resolveTargetJid(msg, args);
    if (!target) {
      await sock.sendMessage(from, ui.info('Mention the user, reply to them, or pass their number. Usage: .demote @user'));
      return;
    }

    try {
      await sock.groupParticipantsUpdate(from, [target], 'demote');
      await sock.sendMessage(from, { ...ui.success(`Demoted @${jidToNumber(target)}.`), mentions: [target] });
    } catch (err) {
      await sock.sendMessage(from, ui.fail(`Failed to demote that member: ${err.message}`));
    }
  },
};
