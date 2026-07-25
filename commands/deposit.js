// commands/deposit.js

const economy = require('../lib/economy');

module.exports = {
  name: 'deposit',
  emoji: '🏦',
  aliases: ['dep'],
  category: 'economy',
  description: 'Moves coins from your wallet into your bank (safe from .rob). Usage: .deposit <amount|all>',
  usage: '.deposit <amount|all>',
  async execute({ sock, from, sender, args }) {
    const { wallet } = economy.getBalance(sender);
    const amount = args[0] === 'all' ? wallet : parseInt(args[0], 10);

    if (!amount || amount <= 0) {
      await sock.sendMessage(from, { text: 'Usage: .deposit <amount|all>' });
      return;
    }

    const result = economy.deposit(sender, amount);
    if (!result) {
      await sock.sendMessage(from, { text: "❌ You don't have that much in your wallet." });
      return;
    }

    await sock.sendMessage(from, {
      text: `🏦 Deposited ${economy.formatCoins(amount)}. New bank balance: ${economy.formatCoins(result.bank)}.`,
    });
  },
};
