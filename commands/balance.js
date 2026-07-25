// commands/balance.js

const economy = require('../lib/economy');

module.exports = {
  name: 'balance',
  emoji: '💰',
  aliases: ['bal', 'wallet'],
  category: 'economy',
  description: 'Shows your (or a mentioned user\'s) wallet, bank, and total balance.',
  usage: '.balance [@user]',
  async execute({ sock, msg, from, sender, args }) {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned || sender;

    const { wallet, bank, total } = economy.getBalance(target);
    const who = target === sender ? 'Your' : "Their";

    await sock.sendMessage(
      from,
      {
        text:
          `💰 *${who} Balance*\n\n` +
          `👛 Wallet: ${economy.formatCoins(wallet)}\n` +
          `🏦 Bank: ${economy.formatCoins(bank)}\n` +
          `📊 Total: ${economy.formatCoins(total)}`,
        mentions: target === sender ? [] : [target],
      }
    );
  },
};
