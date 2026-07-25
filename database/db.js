// database/db.js
// Minimal JSON-file database. Swap this module out for a SQLite-backed
// version later without touching any command files, as long as the same
// get/set/all API is kept.
//
// [Phase 4 optimization] Economy, leveling, and games all read/write this
// far more often than Phases 1-3 did (e.g. every XP-earning message).
// Re-reading and re-writing the whole JSON file from disk on every single
// call doesn't scale well, so this now keeps the parsed data in memory
// and debounces the disk write instead of doing one per call. The
// public API (get/set/all/keyFor) is unchanged, so nothing outside this
// file needed to change.

const fs = require('fs-extra');
const path = require('path');
const logger = require('../lib/logger');

const DB_PATH = path.join(__dirname, 'db.json');
const WRITE_DEBOUNCE_MS = 250;

const DEFAULT_SHAPE = {
  users: {},
  groups: {},
  settings: {},
};

let cache = null;
let writeTimer = null;

function loadFromDisk() {
  fs.ensureFileSync(DB_PATH);
  const raw = fs.readFileSync(DB_PATH, 'utf-8').trim();
  if (!raw) {
    fs.writeJsonSync(DB_PATH, DEFAULT_SHAPE, { spaces: 2 });
    return { ...DEFAULT_SHAPE };
  }
  try {
    return fs.readJsonSync(DB_PATH);
  } catch (err) {
    logger.error({ err }, 'Failed to read database, resetting to default shape');
    fs.writeJsonSync(DB_PATH, DEFAULT_SHAPE, { spaces: 2 });
    return { ...DEFAULT_SHAPE };
  }
}

function ensureCache() {
  if (cache === null) cache = loadFromDisk();
  return cache;
}

/**
 * Writes the in-memory cache to disk immediately, skipping the debounce.
 * Used on process shutdown so nothing is lost.
 */
function flush() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  if (cache !== null) {
    fs.writeJsonSync(DB_PATH, cache, { spaces: 2 });
  }
}

function scheduleWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      fs.writeJsonSync(DB_PATH, cache, { spaces: 2 });
    } catch (err) {
      logger.error({ err }, 'Failed to write database to disk');
    }
  }, WRITE_DEBOUNCE_MS);
  // Don't let a pending write keep the process alive on its own.
  if (writeTimer.unref) writeTimer.unref();
}

/**
 * Get a value by dot path, e.g. "users.234801234.warnings"
 */
function get(dotPath, fallback = undefined) {
  const data = ensureCache();
  const parts = dotPath.split('.');
  let cur = data;
  for (const p of parts) {
    if (cur == null || !(p in cur)) return fallback;
    cur = cur[p];
  }
  return cur;
}

/**
 * Set a value by dot path, creating intermediate objects as needed.
 */
function set(dotPath, value) {
  const data = ensureCache();
  const parts = dotPath.split('.');
  let cur = data;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  scheduleWrite();
  return value;
}

function all() {
  return ensureCache();
}

/**
 * Sanitizes an id (JIDs like "123@g.us" or "123@s.whatsapp.net") so it can
 * be safely used as a single segment inside a dot-path passed to get/set.
 * Without this, the "." in "@g.us" / "@s.whatsapp.net" would be split into
 * extra nesting levels and corrupt the stored structure.
 */
function keyFor(id) {
  return String(id).replace(/[.@:]/g, '_');
}

module.exports = { get, set, all, keyFor, flush, DB_PATH };
