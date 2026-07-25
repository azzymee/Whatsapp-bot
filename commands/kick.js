// commands/kick.js

const { resolveTargetJid, jidToNumber } = require('../utils/helpers');
const ui = require('../utils/ui');

module.exports = {
  name: 'kick',
  emoji: '🥾',
  aliases: ['remove'],
  category: 'admin',
  description: 'Removes a member from the group. Usage: .kick @user (or reply to their message)',
  usage: '.kick @user',
  groupOnly: true,
  adminOnly: true,
  botAdminRequired: true,
  async execute({ sock, msg, from, args }) {
    const target = resolveTargetJid(msg, args);
    if (!target) {
      await sock.sendMessage(from, ui.info('Mention the user, reply to them, or pass their number. Usage: .kick @user'));
      return;
    }

    try {
      await sock.groupParticipantsUpdate(from, [target], 'remove');
      await sock.sendMessage(from, { ...ui.success(`Removed @${jidToNumber(target)}.`), mentions: [target] });
    } catch (err) {
      await sock.sendMessage(from, ui.fail(`Failed to remove that member: ${err.message}`));
    }
  },
};
