// lib/settings.js
// Per-group feature toggles (welcome, anti-link, anti-spam, anti-delete)
// and message templates, stored through database/db.js. Commands and
// events should always go through this module instead of touching the
// db with raw dot-paths, so the default shape only lives in one place.

const db = require('../database/db');

const DEFAULT_WELCOME_MESSAGE =
  'Welcome to the group, @user! 🎉 Please read the group description and be respectful.';
const DEFAULT_GOODBYE_MESSAGE = 'Goodbye @user, we will miss you! 👋';

const DEFAULTS = {
  welcome: true,
  goodbye: true,
  antilink: false,
  antispam: false,
  antidelete: false,
  welcomeMessage: DEFAULT_WELCOME_MESSAGE,
  goodbyeMessage: DEFAULT_GOODBYE_MESSAGE,
};

function getGroupSettings(groupId) {
  const stored = db.get(`groups.${db.keyFor(groupId)}.settings`, {});
  return { ...DEFAULTS, ...stored };
}

function setGroupSetting(groupId, key, value) {
  if (!(key in DEFAULTS)) {
    throw new Error(`Unknown group setting: ${key}`);
  }
  db.set(`groups.${db.keyFor(groupId)}.settings.${key}`, value);
  return value;
}

/**
 * Tracks a moderation "strike" (anti-link/anti-spam violation) for a user
 * in a group. Returns the new strike count. Used to escalate from a
 * warning to a kick after repeated offenses.
 */
function addStrike(groupId, jid, type) {
  const path = `groups.${db.keyFor(groupId)}.strikes.${type}.${db.keyFor(jid)}`;
  const current = db.get(path, 0);
  const next = current + 1;
  db.set(path, next);
  return next;
}

function resetStrikes(groupId, jid, type) {
  const path = `groups.${db.keyFor(groupId)}.strikes.${type}.${db.keyFor(jid)}`;
  db.set(path, 0);
}

module.exports = {
  DEFAULTS,
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_GOODBYE_MESSAGE,
  getGroupSettings,
  setGroupSetting,
  addStrike,
  resetStrikes,
};
