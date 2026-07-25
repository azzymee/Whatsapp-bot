// commands/trivia.js
// Multiple-choice trivia using the local question bank in
// lib/triviaQuestions.js. `.trivia` (with no game running) asks a new
// question; `.trivia <A|B|C|D>` answers the current one.

const gameManager = require('../lib/gameManager');
const economy = require('../lib/economy');
const questions = require('../lib/triviaQuestions');

const GAME_TYPE = 'trivia';
const LETTERS = ['A', 'B', 'C', 'D'];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

module.exports = {
  name: 'trivia',
  emoji: '🧠',
  category: 'games',
  description: 'Trivia game. Usage: .trivia to get a question, then .trivia <A|B|C|D> to answer.',
  usage: '.trivia | .trivia <A|B|C|D>',
  async execute({ sock, from, sender, args }) {
    const existing = gameManager.getSession(from);

    if (!existing || existing.type !== GAME_TYPE) {
      const q = questions[Math.floor(Math.random() * questions.length)];
      const options = shuffle([q.answer, ...q.wrong]);
      const correctLetter = LETTERS[options.indexOf(q.answer)];

      gameManager.startSession(from, GAME_TYPE, { options, correctLetter, question: q.question }, sender, 60000);

      const optionsText = options.map((opt, i) => `${LETTERS[i]}. ${opt}`).join('\n');
      await sock.sendMessage(from, {
        text: `🧠 *Trivia*\n\n${q.question}\n\n${optionsText}\n\nAnswer with .trivia <A|B|C|D> (60s)`,
      });
      return;
    }

    const answer = (args[0] || '').toUpperCase();
    if (!LETTERS.includes(answer)) {
      await sock.sendMessage(from, { text: 'Usage: .trivia <A|B|C|D>' });
      return;
    }

    const { correctLetter, options } = existing.data;
    gameManager.endSession(from);

    if (answer === correctLetter) {
      economy.addWallet(sender, 60);
      await sock.sendMessage(from, { text: `🎉 Correct! The answer was ${correctLetter}. You earned ${economy.formatCoins(60)}!` });
    } else {
      const correctIndex = LETTERS.indexOf(correctLetter);
      await sock.sendMessage(from, { text: `❌ Wrong! The correct answer was ${correctLetter}. ${options[correctIndex]}` });
    }
  },
};
