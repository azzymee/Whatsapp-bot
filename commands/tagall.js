// commands/tagall.js

const { jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'tagall',
  emoji: '📢',
  aliases: ['everyone'],
  category: 'admin',
  description: 'Mentions every member of the group. Usage: .tagall [message]',
  usage: '.tagall [message]',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, from, text }) {
    const metadata = await sock.groupMetadata(from);
    const participants = metadata.participants.map((p) => p.id);

    let body = text ? `*${text}*\n\n` : '*Attention everyone!*\n\n';
    body += participants.map((jid) => `@${jidToNumber(jid)}`).join(' ');

    await sock.sendMessage(from, { text: body, mentions: participants });
  },
};
