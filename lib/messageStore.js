// lib/messageStore.js
// In-memory cache of recently seen messages, keyed by message id.
// WhatsApp's delete ("revoke") event only carries a reference to the
// original message key, not its content, so anti-delete has to keep its
// own short-lived cache to know what was actually removed.
//
// Deliberately in-memory only (not persisted to database/db.js): this is
// a rolling cache, not durable data, and keeping it out of the JSON db
// avoids disk writes on every single incoming message.

const MAX_ENTRIES = 2000;

const store = new Map();

function save(msg) {
  const id = msg?.key?.id;
  if (!id) return;

  store.set(id, {
    key: msg.key,
    message: msg.message,
    sender: msg.key.participant || msg.key.remoteJid,
    remoteJid: msg.key.remoteJid,
    timestamp: Date.now(),
  });

  if (store.size > MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }
}

function get(id) {
  return store.get(id) || null;
}

function remove(id) {
  store.delete(id);
}

module.exports = { save, get, remove };
