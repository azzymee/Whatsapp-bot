// lib/spamTracker.js
// Sliding-window message-rate tracker used by anti-spam. Deliberately
// in-memory: it resets on restart, which is fine since spam bursts are a
// live, short-timeframe problem, not something that needs to survive a
// bot restart.

const WINDOW_MS = Number(process.env.ANTISPAM_WINDOW_MS) || 10_000; // 10s
const MAX_MESSAGES = Number(process.env.ANTISPAM_MAX_MESSAGES) || 6; // 6 msgs / 10s

// "groupId:jid" -> array of timestamps (ms)
const hits = new Map();

/**
 * Records a message from `jid` in `groupId` and returns true if that
 * user has exceeded the allowed rate within the current window.
 */
function recordAndCheck(groupId, jid) {
  const key = `${groupId}:${jid}`;
  const now = Date.now();
  const timestamps = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > MAX_MESSAGES;
}

/**
 * Periodically drops entries whose whole timestamp window has expired.
 * A per-call check in recordAndCheck() can't catch this on its own,
 * since a sender who is only ever checked once leaves a stale entry
 * that's never touched again — this sweep is what actually bounds
 * memory on a long-running process with many distinct senders.
 */
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(key);
    else if (fresh.length !== timestamps.length) hits.set(key, fresh);
  }
}, WINDOW_MS * 6);
if (sweepTimer.unref) sweepTimer.unref();

/**
 * Clears the tracked history for a user, e.g. after they've been warned
 * or removed, so the next window starts clean.
 */
function reset(groupId, jid) {
  hits.delete(`${groupId}:${jid}`);
}

module.exports = { recordAndCheck, reset, WINDOW_MS, MAX_MESSAGES };
