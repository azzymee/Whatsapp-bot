// lib/gameManager.js
// Tracks in-progress, stateful games (hangman, tictactoe, trivia, guess)
// per chat. Deliberately in-memory only, keyed by chat JID: a game
// doesn't need to survive a bot restart, and this avoids hammering the
// JSON database with a write on every guess.

// chatId -> { type, data, startedBy, expiresAt, timeout }
const sessions = new Map();

/**
 * Starts a new game session for a chat. Refuses to overwrite an
 * existing one — callers should check getSession() first and tell the
 * user to finish/cancel it.
 */
function startSession(chatId, type, data, startedBy, timeoutMs = 120000) {
  if (sessions.has(chatId)) return false;

  const timeout = setTimeout(() => endSession(chatId), timeoutMs);
  sessions.set(chatId, {
    type,
    data,
    startedBy,
    expiresAt: Date.now() + timeoutMs,
    timeout,
  });
  return true;
}

function getSession(chatId) {
  return sessions.get(chatId) || null;
}

/**
 * Replaces the `data` of an existing session (e.g. updated board state)
 * without resetting its expiry timer.
 */
function updateSession(chatId, data) {
  const session = sessions.get(chatId);
  if (!session) return false;
  session.data = data;
  return true;
}

function endSession(chatId) {
  const session = sessions.get(chatId);
  if (!session) return false;
  clearTimeout(session.timeout);
  sessions.delete(chatId);
  return true;
}

function hasSession(chatId, type) {
  const session = sessions.get(chatId);
  if (!session) return false;
  return type ? session.type === type : true;
}

module.exports = {
  startSession,
  getSession,
  updateSession,
  endSession,
  hasSession,
};
