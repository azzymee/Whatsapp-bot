// commands/coinflip.js

const economy = require('../lib/economy');

module.exports = {
  name: 'coinflip',
  emoji: '🪙',
  aliases: ['flip', 'cf'],
  category: 'games',
  description: 'Flips a coin. Optionally bet coins: .coinflip <heads|tails> <amount>',
  usage: '.coinflip [heads|tails] [amount]',
  cooldown: 2,
  async execute({ sock, from, sender, args }) {
    const call = (args[0] || '').toLowerCase();
    const result = Math.random() < 0.5 ? 'heads' : 'tails';

    // Plain flip, no bet involved.
    if (!['heads', 'tails'].includes(call)) {
      await sock.sendMessage(from, { text: `🪙 The coin landed on *${result}*!` });
      return;
    }

    const amount = parseInt(args[1], 10);
    if (!amount || amount <= 0) {
      await sock.sendMessage(from, { text: `🪙 The coin landed on *${result}*!` });
      return;
    }

    const { wallet } = economy.getBalance(sender);
    if (amount > wallet) {
      await sock.sendMessage(from, { text: "❌ You don't have that many coins in your wallet." });
      return;
    }

    const won = call === result;
    economy.addWallet(sender, won ? amount : -amount);

    await sock.sendMessage(from, {
      text:
        `🪙 The coin landed on *${result}*!\n` +
        (won
          ? `🎉 You won ${economy.formatCoins(amount)}!`
          : `😢 You lost ${economy.formatCoins(amount)}.`),
    });
  },
};
