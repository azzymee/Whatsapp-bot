// commands/pay.js

const economy = require('../lib/economy');
const { resolveTargetJid, jidToNumber } = require('../utils/helpers');

module.exports = {
  name: 'pay',
  emoji: '💸',
  aliases: ['transfer', 'give'],
  category: 'economy',
  description: 'Sends coins from your wallet to another user. Usage: .pay @user <amount>',
  usage: '.pay @user <amount>',
  cooldown: 2,
  async execute({ sock, msg, from, sender, args }) {
    const target = resolveTargetJid(msg, args);
    if (!target) {
      await sock.sendMessage(from, { text: 'Mention someone or reply to them. Usage: .pay @user <amount>' });
      return;
    }
    if (target === sender) {
      await sock.sendMessage(from, { text: "You can't pay yourself." });
      return;
    }

    const amountArg = args.find((a) => /^\d+$/.test(a));
    const amount = amountArg ? parseInt(amountArg, 10) : NaN;
    if (!amount || amount <= 0) {
      await sock.sendMessage(from, { text: 'Usage: .pay @user <amount> (amount must be a positive whole number)' });
      return;
    }

    const success = economy.transfer(sender, target, amount);
    if (!success) {
      await sock.sendMessage(from, { text: "❌ You don't have enough in your wallet for that." });
      return;
    }

    await sock.sendMessage(from, {
      text: `✅ You sent ${economy.formatCoins(amount)} to @${jidToNumber(target)}.`,
      mentions: [target],
    });
  },
};
