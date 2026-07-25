// commands/guess.js
// Number guessing game. `.guess start [max]` begins a game, then
// `.guess <number>` submits a guess. State lives in lib/gameManager.js,
// scoped per chat, so only one guessing game can run at a time per chat.

const gameManager = require('../lib/gameManager');
const economy = require('../lib/economy');

const GAME_TYPE = 'guess';
const DEFAULT_MAX = 100;
const REWARD_BASE = 50;

module.exports = {
  name: 'guess',
  emoji: '🔢',
  category: 'games',
  description: 'Number guessing game. Usage: .guess start [max] then .guess <number>',
  usage: '.guess start [max] | .guess <number>',
  async execute({ sock, from, sender, args }) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'start') {
      if (gameManager.hasSession(from, GAME_TYPE)) {
        await sock.sendMessage(from, { text: 'A guessing game is already running in this chat. Use .guess <number> to play.' });
        return;
      }

      const max = Math.min(Math.max(parseInt(args[1], 10) || DEFAULT_MAX, 10), 10000);
      const secret = Math.floor(Math.random() * max) + 1;

      gameManager.startSession(from, GAME_TYPE, { secret, max, attempts: 0 }, sender, 120000);

      await sock.sendMessage(from, {
        text: `🔢 I'm thinking of a number between 1 and ${max}. Guess with .guess <number>! (2 minutes)`,
      });
      return;
    }

    const session = gameManager.getSession(from);
    if (!session || session.type !== GAME_TYPE) {
      await sock.sendMessage(from, { text: 'No active guessing game. Start one with .guess start [max]' });
      return;
    }

    const guessNum = parseInt(sub, 10);
    if (Number.isNaN(guessNum)) {
      await sock.sendMessage(from, { text: 'Usage: .guess <number>' });
      return;
    }

    session.data.attempts += 1;
    gameManager.updateSession(from, session.data);

    if (guessNum === session.data.secret) {
      const reward = Math.max(REWARD_BASE, Math.floor(500 / session.data.attempts));
      economy.addWallet(sender, reward);
      gameManager.endSession(from);
      await sock.sendMessage(from, {
        text: `🎉 Correct! The number was ${guessNum}. You got it in ${session.data.attempts} attempt(s) and earned ${economy.formatCoins(reward)}!`,
      });
      return;
    }

    const hint = guessNum < session.data.secret ? 'higher ⬆️' : 'lower ⬇️';
    await sock.sendMessage(from, { text: `Nope, try ${hint}!` });
  },
};
