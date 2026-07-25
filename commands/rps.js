// commands/rps.js

const CHOICES = ['rock', 'paper', 'scissors'];
const EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

module.exports = {
  name: 'rps',
  emoji: '✊',
  category: 'games',
  description: 'Play rock-paper-scissors against the bot. Usage: .rps <rock|paper|scissors>',
  usage: '.rps <rock|paper|scissors>',
  async execute({ sock, from, args }) {
    const choice = (args[0] || '').toLowerCase();
    if (!CHOICES.includes(choice)) {
      await sock.sendMessage(from, { text: 'Usage: .rps <rock|paper|scissors>' });
      return;
    }

    const botChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];

    let result;
    if (choice === botChoice) result = "It's a tie!";
    else if (BEATS[choice] === botChoice) result = '🎉 You win!';
    else result = '😢 You lose!';

    await sock.sendMessage(from, {
      text: `You: ${EMOJI[choice]} ${choice}\nBot: ${EMOJI[botChoice]} ${botChoice}\n\n${result}`,
    });
  },
};
