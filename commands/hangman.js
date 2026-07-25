// commands/hangman.js
// Classic hangman. `.hangman start` begins a game with a random word,
// then `.hangman <letter>` guesses a letter. State lives in
// lib/gameManager.js, scoped per chat.

const gameManager = require('../lib/gameManager');
const economy = require('../lib/economy');

const GAME_TYPE = 'hangman';
const MAX_WRONG = 6;
const WORDS = [
  'javascript', 'baileys', 'whatsapp', 'developer', 'keyboard', 'function',
  'database', 'internet', 'computer', 'elephant', 'mountain', 'sandwich',
  'umbrella', 'triangle', 'notebook', 'universe', 'birthday',
];

const WORD_LIST = WORDS;

function renderWord(word, guessed) {
  return word
    .split('')
    .map((ch) => (guessed.includes(ch) ? ch : '_'))
    .join(' ');
}

module.exports = {
  name: 'hangman',
  emoji: '🔤',
  aliases: ['hm'],
  category: 'games',
  description: 'Hangman game. Usage: .hangman start then .hangman <letter>',
  usage: '.hangman start | .hangman <letter>',
  async execute({ sock, from, sender, args }) {
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'start') {
      if (gameManager.hasSession(from, GAME_TYPE)) {
        await sock.sendMessage(from, { text: 'A hangman game is already running in this chat.' });
        return;
      }

      const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
      gameManager.startSession(from, GAME_TYPE, { word, guessed: [], wrong: 0 }, sender, 180000);

      await sock.sendMessage(from, {
        text: `🪢 Hangman started! ${renderWord(word, [])}\nGuess a letter with .hangman <letter>. Wrong guesses: 0/${MAX_WRONG}`,
      });
      return;
    }

    const session = gameManager.getSession(from);
    if (!session || session.type !== GAME_TYPE) {
      await sock.sendMessage(from, { text: 'No active hangman game. Start one with .hangman start' });
      return;
    }

    const letter = sub;
    if (!/^[a-z]$/.test(letter)) {
      await sock.sendMessage(from, { text: 'Usage: .hangman <single letter a-z>' });
      return;
    }

    const { word, guessed, wrong } = session.data;
    if (guessed.includes(letter)) {
      await sock.sendMessage(from, { text: `You already guessed "${letter}".` });
      return;
    }

    guessed.push(letter);
    let newWrong = wrong;
    if (!word.includes(letter)) newWrong += 1;

    session.data.guessed = guessed;
    session.data.wrong = newWrong;
    gameManager.updateSession(from, session.data);

    const display = renderWord(word, guessed);

    if (!display.includes('_')) {
      economy.addWallet(sender, 100);
      gameManager.endSession(from);
      await sock.sendMessage(from, { text: `🎉 You won! The word was *${word}*. You earned ${economy.formatCoins(100)}!` });
      return;
    }

    if (newWrong >= MAX_WRONG) {
      gameManager.endSession(from);
      await sock.sendMessage(from, { text: `💀 Game over! The word was *${word}*.` });
      return;
    }

    await sock.sendMessage(from, {
      text: `${display}\nWrong guesses: ${newWrong}/${MAX_WRONG}\nGuessed letters: ${guessed.join(', ') || 'none'}`,
    });
  },
};
