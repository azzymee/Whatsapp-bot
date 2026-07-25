// lib/economy.js
// Wallet/bank economy system stored through database/db.js. Commands
// should always go through this module instead of touching the db with
// raw dot-paths, so the default shape and all balance math only lives
// in one place.

const db = require('../database/db');
const config = require('../config/config');

const DEFAULT_ECONOMY = {
  wallet: 0,
  bank: 0,
  lastDaily: 0,
  lastWork: 0,
  lastRob: 0,
};

function getEconomy(jid) {
  const stored = db.get(`users.${db.keyFor(jid)}.economy`, {});
  return { ...DEFAULT_ECONOMY, ...stored };
}

function saveEconomy(jid, data) {
  db.set(`users.${db.keyFor(jid)}.economy`, data);
  // Keep the original JID alongside the sanitized key so leaderboards can
  // @mention users later (keyFor() is lossy: "." / "@" / ":" get stripped).
  db.set(`users.${db.keyFor(jid)}.jid`, jid);
  return data;
}

function getBalance(jid) {
  const eco = getEconomy(jid);
  return { wallet: eco.wallet, bank: eco.bank, total: eco.wallet + eco.bank };
}

/**
 * Adds (or subtracts, with a negative amount) coins to a user's wallet.
 * Wallet is never allowed to go below zero.
 */
function addWallet(jid, amount) {
  const eco = getEconomy(jid);
  eco.wallet = Math.max(0, eco.wallet + amount);
  saveEconomy(jid, eco);
  return eco.wallet;
}

function addBank(jid, amount) {
  const eco = getEconomy(jid);
  eco.bank = Math.max(0, eco.bank + amount);
  saveEconomy(jid, eco);
  return eco.bank;
}

/**
 * Moves coins from wallet to bank (positive amount) or bank to wallet
 * (this function only handles wallet -> bank; see withdraw()).
 */
function deposit(jid, amount) {
  const eco = getEconomy(jid);
  if (amount <= 0 || amount > eco.wallet) return null;
  eco.wallet -= amount;
  eco.bank += amount;
  saveEconomy(jid, eco);
  return eco;
}

function withdraw(jid, amount) {
  const eco = getEconomy(jid);
  if (amount <= 0 || amount > eco.bank) return null;
  eco.bank -= amount;
  eco.wallet += amount;
  saveEconomy(jid, eco);
  return eco;
}

/**
 * Transfers coins from one user's wallet to another's. Returns false if
 * the sender doesn't have enough.
 */
function transfer(fromJid, toJid, amount) {
  if (amount <= 0) return false;
  const from = getEconomy(fromJid);
  if (from.wallet < amount) return false;
  from.wallet -= amount;
  saveEconomy(fromJid, from);
  addWallet(toJid, amount);
  return true;
}

/**
 * Returns { ok, remainingMs } describing whether enough time has passed
 * since `lastField` for a cooldown of `cooldownMs` to be over.
 */
function checkCooldown(jid, lastField, cooldownMs) {
  const eco = getEconomy(jid);
  const last = eco[lastField] || 0;
  const elapsed = Date.now() - last;
  if (elapsed >= cooldownMs) return { ok: true, remainingMs: 0 };
  return { ok: false, remainingMs: cooldownMs - elapsed };
}

function markCooldown(jid, lastField) {
  const eco = getEconomy(jid);
  eco[lastField] = Date.now();
  saveEconomy(jid, eco);
}

/**
 * Returns the top N users by total (wallet + bank) balance, as an array
 * of { jid, wallet, bank, total }, sorted descending.
 */
function getLeaderboard(limit = 10) {
  const users = db.get('users', {});
  const rows = [];
  for (const [safeKey, data] of Object.entries(users)) {
    if (!data.economy) continue;
    const jid = data.jid || safeKey;
    const wallet = data.economy.wallet || 0;
    const bank = data.economy.bank || 0;
    rows.push({ jid, wallet, bank, total: wallet + bank });
  }
  rows.sort((a, b) => b.total - a.total);
  return rows.slice(0, limit);
}

/**
 * Formats a raw coin number using the configured currency symbol/name.
 */
function formatCoins(amount) {
  return `${config.economy.currencySymbol}${Number(amount).toLocaleString('en-US')}`;
}

module.exports = {
  getEconomy,
  getBalance,
  addWallet,
  addBank,
  deposit,
  withdraw,
  transfer,
  checkCooldown,
  markCooldown,
  getLeaderboard,
  formatCoins,
};
