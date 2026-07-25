// commands/withdraw.js

const economy = require('../lib/economy');

module.exports = {
  name: 'withdraw',
  emoji: '💵',
  aliases: ['wd'],
  category: 'economy',
  description: 'Moves coins from your bank back into your wallet. Usage: .withdraw <amount|all>',
  usage: '.withdraw <amount|all>',
  async execute({ sock, from, sender, args }) {
    const { bank } = economy.getBalance(sender);
    const amount = args[0] === 'all' ? bank : parseInt(args[0], 10);

    if (!amount || amount <= 0) {
      await sock.sendMessage(from, { text: 'Usage: .withdraw <amount|all>' });
      return;
    }

    const result = economy.withdraw(sender, amount);
    if (!result) {
      await sock.sendMessage(from, { text: "❌ You don't have that much in your bank." });
      return;
    }

    await sock.sendMessage(from, {
      text: `👛 Withdrew ${economy.formatCoins(amount)}. New wallet balance: ${economy.formatCoins(result.wallet)}.`,
    });
  },
};
