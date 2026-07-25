// commands/tictactoe.js
// Two-player tic-tac-toe. `.tictactoe @opponent` challenges someone in
// the group, then both players take turns with `.tictactoe <1-9>`
// (numpad-style board layout). State lives in lib/gameManager.js.

const gameManager = require('../lib/gameManager');
const economy = require('../lib/economy');
const { resolveTargetJid, jidToNumber } = require('../utils/helpers');

const GAME_TYPE = 'tictactoe';
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function renderBoard(board) {
  const cell = (i) => (board[i] === null ? `${i + 1}` : board[i]);
  return [
    `${cell(0)} | ${cell(1)} | ${cell(2)}`,
    '---------',
    `${cell(3)} | ${cell(4)} | ${cell(5)}`,
    '---------',
    `${cell(6)} | ${cell(7)} | ${cell(8)}`,
  ].join('\n');
}

function getWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

module.exports = {
  name: 'tictactoe',
  emoji: '⭕',
  aliases: ['ttt'],
  category: 'games',
  groupOnly: true,
  description: 'Two-player tic-tac-toe. Usage: .tictactoe @opponent then .tictactoe <1-9>',
  usage: '.tictactoe @opponent | .tictactoe <1-9>',
  async execute({ sock, msg, from, sender, args }) {
    const existing = gameManager.getSession(from);

    // No active game: this must be a challenge.
    if (!existing || existing.type !== GAME_TYPE) {
      const opponent = resolveTargetJid(msg, args);
      if (!opponent) {
        await sock.sendMessage(from, { text: 'Usage: .tictactoe @opponent' });
        return;
      }
      if (opponent === sender) {
        await sock.sendMessage(from, { text: "You can't play against yourself." });
        return;
      }

      const board = new Array(9).fill(null);
      gameManager.startSession(
        from,
        GAME_TYPE,
        { board, players: { X: sender, O: opponent }, turn: 'X' },
        sender,
        300000
      );

      await sock.sendMessage(from, {
        text:
          `⭕ *Tic-Tac-Toe*\n@${jidToNumber(sender)} (X) vs @${jidToNumber(opponent)} (O)\n\n` +
          `${renderBoard(board)}\n\nIt's X's turn. Play with .tictactoe <1-9>`,
        mentions: [sender, opponent],
      });
      return;
    }

    // A game is active: this must be a move.
    const { board, players, turn } = existing.data;
    const currentPlayerJid = players[turn];

    if (sender !== currentPlayerJid) {
      await sock.sendMessage(from, { text: "❌ It's not your turn." });
      return;
    }

    const pos = parseInt(args[0], 10) - 1;
    if (Number.isNaN(pos) || pos < 0 || pos > 8) {
      await sock.sendMessage(from, { text: 'Usage: .tictactoe <1-9>' });
      return;
    }
    if (board[pos] !== null) {
      await sock.sendMessage(from, { text: 'That cell is already taken.' });
      return;
    }

    board[pos] = turn;
    const winner = getWinner(board);
    const isDraw = !winner && board.every((c) => c !== null);

    if (winner || isDraw) {
      gameManager.endSession(from);

      if (winner) {
        const winnerJid = players[winner];
        economy.addWallet(winnerJid, 75);
        await sock.sendMessage(from, {
          text: `${renderBoard(board)}\n\n🎉 @${jidToNumber(winnerJid)} (${winner}) wins and earns ${economy.formatCoins(75)}!`,
          mentions: [players.X, players.O],
        });
      } else {
        await sock.sendMessage(from, {
          text: `${renderBoard(board)}\n\n🤝 It's a draw!`,
          mentions: [players.X, players.O],
        });
      }
      return;
    }

    const nextTurn = turn === 'X' ? 'O' : 'X';
    existing.data.board = board;
    existing.data.turn = nextTurn;
    gameManager.updateSession(from, existing.data);

    await sock.sendMessage(from, {
      text: `${renderBoard(board)}\n\nIt's @${jidToNumber(players[nextTurn])}'s (${nextTurn}) turn.`,
      mentions: [players[nextTurn]],
    });
  },
};
