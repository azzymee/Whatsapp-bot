// commands/rob.js

const economy = require('../lib/economy');
const config = require('../config/config');
const { resolveTargetJid, jidToNumber } = require('../utils/helpers');

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

module.exports = {
  name: 'rob',
  emoji: '🕵️',
  category: 'economy',
  description: 'Attempt to rob another user\'s wallet. Usage: .rob @user',
  usage: '.rob @user',
  cooldown: 3,
  async execute({ sock, msg, from, sender, args }) {
    const target = resolveTargetJid(msg, args);
    if (!target) {
      await sock.sendMessage(from, { text: 'Mention someone or reply to them. Usage: .rob @user' });
      return;
    }
    if (target === sender) {
      await sock.sendMessage(from, { text: "You can't rob yourself." });
      return;
    }

    const { ok, remainingMs } = economy.checkCooldown(sender, 'lastRob', config.economy.robCooldownMs);
    if (!ok) {
      await sock.sendMessage(from, {
        text: `⏳ You're laying low from your last heist. Try again in ${formatDuration(remainingMs)}.`,
      });
      return;
    }

    const targetBalance = economy.getBalance(target);
    if (targetBalance.wallet < config.economy.robMinTargetWallet) {
      await sock.sendMessage(from, {
        text: `❌ @${jidToNumber(target)} doesn't have enough in their wallet to be worth robbing.`,
        mentions: [target],
      });
      return;
    }

    economy.markCooldown(sender, 'lastRob');
    const success = Math.random() < config.economy.robSuccessChance;

    if (success) {
      const stolen = Math.floor(targetBalance.wallet * (0.1 + Math.random() * 0.3));
      economy.addWallet(target, -stolen);
      economy.addWallet(sender, stolen);
      await sock.sendMessage(from, {
        text: `🦹 You robbed @${jidToNumber(target)} and got away with ${economy.formatCoins(stolen)}!`,
        mentions: [target],
      });
    } else {
      const fine = Math.floor(50 + Math.random() * 150);
      economy.addWallet(sender, -fine);
      await sock.sendMessage(from, {
        text: `🚨 You got caught trying to rob @${jidToNumber(target)} and paid a fine of ${economy.formatCoins(fine)}.`,
        mentions: [target],
      });
    }
  },
};
