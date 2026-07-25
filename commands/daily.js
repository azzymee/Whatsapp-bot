// commands/daily.js

const economy = require('../lib/economy');
const config = require('../config/config');

function formatDuration(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

module.exports = {
  name: 'daily',
  emoji: '📅',
  category: 'economy',
  description: 'Claims your daily coin reward.',
  usage: '.daily',
  cooldown: 3,
  async execute({ sock, from, sender }) {
    const { ok, remainingMs } = economy.checkCooldown(sender, 'lastDaily', config.economy.dailyCooldownMs);

    if (!ok) {
      await sock.sendMessage(from, {
        text: `⏳ You've already claimed your daily reward. Come back in ${formatDuration(remainingMs)}.`,
      });
      return;
    }

    economy.addWallet(sender, config.economy.dailyAmount);
    economy.markCooldown(sender, 'lastDaily');

    await sock.sendMessage(from, {
      text: `✅ You claimed your daily reward of ${economy.formatCoins(config.economy.dailyAmount)}!`,
    });
  },
};
