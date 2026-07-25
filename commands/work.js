// commands/work.js

const economy = require('../lib/economy');
const config = require('../config/config');

const JOBS = [
  'delivered packages across town',
  'fixed a bug in production at 3am',
  'walked five dogs at once',
  'flipped burgers at the diner',
  'busked on a street corner',
  'helped a farmer harvest crops',
  'wrote a viral tweet thread',
  'taught a coding class',
  'painted a fence',
  'washed dishes at a restaurant',
];

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

module.exports = {
  name: 'work',
  emoji: '💼',
  category: 'economy',
  description: 'Work a random job for a chance to earn coins.',
  usage: '.work',
  cooldown: 3,
  async execute({ sock, from, sender }) {
    const { ok, remainingMs } = economy.checkCooldown(sender, 'lastWork', config.economy.workCooldownMs);

    if (!ok) {
      await sock.sendMessage(from, {
        text: `⏳ You're tired from your last shift. Try working again in ${formatDuration(remainingMs)}.`,
      });
      return;
    }

    const { workMin, workMax } = config.economy;
    const earned = Math.floor(Math.random() * (workMax - workMin + 1)) + workMin;
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];

    economy.addWallet(sender, earned);
    economy.markCooldown(sender, 'lastWork');

    await sock.sendMessage(from, {
      text: `💼 You ${job} and earned ${economy.formatCoins(earned)}!`,
    });
  },
};
