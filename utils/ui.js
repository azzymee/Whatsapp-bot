// utils/ui.js
// Small shared helpers so every command "sounds" like the same bot
// instead of each file inventing its own success/error phrasing.
// Commands are free to build custom messages when they need to (a
// caption with a mention, a formatted stat block, etc.) — these just
// cover the common cases so the boilerplate isn't reinvented 51 times.

const EMOJI = {
  success: '✅',
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  cooldown: '⏳',
};

/**
 * Shows the "typing…" indicator in a chat. Swallows errors since a
 * failed presence update should never break a command.
 */
async function typing(sock, jid) {
  try {
    await sock.sendPresenceUpdate('composing', jid);
  } catch {
    /* not fatal */
  }
}

/** Clears the typing indicator. Safe to call even if typing() wasn't. */
async function stopTyping(sock, jid) {
  try {
    await sock.sendPresenceUpdate('paused', jid);
  } catch {
    /* not fatal */
  }
}

/** { text: "✅ message" } — for a Baileys sendMessage call. */
function success(text) {
  return { text: `${EMOJI.success} ${text}` };
}

/** { text: "❌ message" } */
function fail(text) {
  return { text: `${EMOJI.error} ${text}` };
}

/** { text: "⚠️ message" } */
function warn(text) {
  return { text: `${EMOJI.warn} ${text}` };
}

/** { text: "ℹ️ message" } */
function info(text) {
  return { text: `${EMOJI.info} ${text}` };
}

/** Standard "here's how to use this" message. */
function usage(prefix, cmd, example) {
  const line = cmd.usage || `${prefix}${cmd.name}`;
  return info(`*Usage:* ${line}${example ? `\n*Example:* ${example}` : ''}`);
}

module.exports = { EMOJI, typing, stopTyping, success, fail, warn, info, usage };
