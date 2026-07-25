// commands/dice.js

module.exports = {
  name: 'dice',
  emoji: '🎲',
  aliases: ['roll'],
  category: 'games',
  description: 'Rolls a dice. Usage: .dice [sides] (default 6)',
  usage: '.dice [sides]',
  cooldown: 2,
  async execute({ sock, from, args }) {
    const sides = parseInt(args[0], 10) || 6;
    if (sides < 2 || sides > 1000) {
      await sock.sendMessage(from, { text: 'Pick a number of sides between 2 and 1000.' });
      return;
    }

    const roll = Math.floor(Math.random() * sides) + 1;
    await sock.sendMessage(from, { text: `🎲 You rolled a *${roll}* (out of ${sides}).` });
  },
};
