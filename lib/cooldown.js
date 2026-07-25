// lib/cooldown.js
// Lightweight in-memory per-user, per-command cooldown tracker. Used by
// lib/commandHandler.js when a command declares a `cooldown` (in
// seconds). Deliberately not persisted to disk — cooldowns resetting on
// a bot restart is a fine tradeoff for not writing to the database on
// every single command call.

// "commandName:senderJid" -> timestamp of last successful use
const lastUsed = new Map();

/**
 * Returns 0 if the command is off cooldown for this user (and marks it
 * as used right now), or the number of seconds remaining if it's still
 * on cooldown (and does NOT reset the timer).
 */
function check(commandName, senderJid, cooldownSeconds) {
  if (!cooldownSeconds || cooldownSeconds <= 0) return 0;

  const key = `${commandName}:${senderJid}`;
  const now = Date.now();
  const last = lastUsed.get(key) || 0;
  const elapsedMs = now - last;
  const cooldownMs = cooldownSeconds * 1000;

  if (elapsedMs < cooldownMs) {
    return Math.ceil((cooldownMs - elapsedMs) / 1000);
  }

  lastUsed.set(key, now);
  return 0;
}

// Every unique "command:user" pair that has ever used a cooldown-gated
// command stays in this map, since check() only ever adds entries. On a
// long-running bot with many users this grows without bound, so sweep
// out anything stale well past any realistic cooldown length (the
// longest cooldowns in this project are economy ones, measured in
// hours — 24h of staleness is a safe, generous cutoff).
const STALE_MS = 24 * 60 * 60 * 1000;
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, last] of lastUsed) {
    if (now - last > STALE_MS) lastUsed.delete(key);
  }
}, 60 * 60 * 1000);
if (sweepTimer.unref) sweepTimer.unref();

module.exports = { check };
