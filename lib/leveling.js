// lib/leveling.js
// XP / level tracking, stored through database/db.js under
// users.<key>.leveling. One XP award per user per chat is subject to a
// short cooldown (configurable) so a user can't farm levels by spamming.

const db = require('../database/db');
const config = require('../config/config');

const DEFAULT_LEVELING = {
  xp: 0,
  level: 0,
  lastXpAt: 0,
};

// In-memory only; doesn't need to survive a restart, and avoids a disk
// write on literally every single message.
const lastXpByUser = new Map();

// Every user who has ever sent a message stays in this map forever
// otherwise, since awardMessageXp() only ever adds entries. Sweep out
// anything far older than any realistic xpCooldownMs so long-running
// bots with many users don't grow this without bound.
const STALE_MS = 24 * 60 * 60 * 1000;
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [jid, last] of lastXpByUser) {
    if (now - last > STALE_MS) lastXpByUser.delete(jid);
  }
}, 60 * 60 * 1000);
if (sweepTimer.unref) sweepTimer.unref();

function getLeveling(jid) {
  const stored = db.get(`users.${db.keyFor(jid)}.leveling`, {});
  return { ...DEFAULT_LEVELING, ...stored };
}

function saveLeveling(jid, data) {
  db.set(`users.${db.keyFor(jid)}.leveling`, data);
  db.set(`users.${db.keyFor(jid)}.jid`, jid);
  return data;
}

/**
 * XP required to go from `level` to `level + 1`. Quadratic curve so
 * higher levels take meaningfully longer, without needing a lookup table.
 */
function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

/**
 * Awards a random amount of XP (within config.leveling.xpMin/xpMax) to a
 * user, respecting the per-user cooldown. Returns null if the cooldown
 * is still active, otherwise { xp, level, leveledUp, newLevel }.
 */
function awardMessageXp(jid) {
  const now = Date.now();
  const last = lastXpByUser.get(jid) || 0;
  if (now - last < config.leveling.xpCooldownMs) return null;
  lastXpByUser.set(jid, now);

  const { xpMin, xpMax } = config.leveling;
  const gained = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;

  const data = getLeveling(jid);
  data.xp += gained;

  let leveledUp = false;
  while (data.xp >= xpForLevel(data.level)) {
    data.xp -= xpForLevel(data.level);
    data.level += 1;
    leveledUp = true;
  }

  saveLeveling(jid, data);
  return { gained, xp: data.xp, level: data.level, leveledUp };
}

function getRank(jid) {
  const data = getLeveling(jid);
  return {
    level: data.level,
    xp: data.xp,
    xpNeeded: xpForLevel(data.level),
  };
}

/**
 * Returns the top N users by level (then by xp as a tiebreaker), as an
 * array of { jid, level, xp }.
 */
function getLeaderboard(limit = 10) {
  const users = db.get('users', {});
  const rows = [];
  for (const [safeKey, data] of Object.entries(users)) {
    if (!data.leveling) continue;
    const jid = data.jid || safeKey;
    rows.push({ jid, level: data.leveling.level || 0, xp: data.leveling.xp || 0 });
  }
  rows.sort((a, b) => (b.level - a.level) || (b.xp - a.xp));
  return rows.slice(0, limit);
}

module.exports = {
  getLeveling,
  xpForLevel,
  awardMessageXp,
  getRank,
  getLeaderboard,
};
