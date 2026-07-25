// commands/calc.js
// Evaluates a math expression using mathjs's evaluate() (a safe parser,
// not a raw JS eval).

const { evaluate } = require('mathjs');

module.exports = {
  name: 'calc',
  emoji: '🧮',
  aliases: ['calculate', 'math'],
  category: 'utility',
  description: 'Evaluates a math expression. Usage: .calc 2 * (3 + 4)',
  usage: '.calc <expression>',
  async execute({ sock, from, text, prefix }) {
    if (!text) {
      await sock.sendMessage(from, {
        text: `Usage: ${prefix}calc <expression>\nExample: ${prefix}calc sqrt(16) + 2^3`,
      });
      return;
    }

    try {
      const result = evaluate(text);
      await sock.sendMessage(from, { text: `🧮 ${text} = ${result}` });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Invalid expression: ${err.message}` });
    }
  },
};
