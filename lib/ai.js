// lib/ai.js
// Thin wrapper around the Gemini API generateContent REST endpoint, plus
// a small in-memory per-chat conversation history so replies stay
// contextual. Uses Node's built-in fetch (Node >= 18), so no extra
// dependency was added to package.json for this.

const config = require('../config/config');
const logger = require('./logger');

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_HISTORY_TURNS = 10; // user+model pairs kept per chat

// chatId -> [{ role: 'user'|'model', parts: [{ text }] }, ...]
const history = new Map();
// chatId -> timestamp of last activity, used only to know what's stale
// enough to sweep below — kept separate so it doesn't affect the shape
// of what's actually sent to Gemini.
const lastActivity = new Map();

function getHistory(chatId) {
  return history.get(chatId) || [];
}

function pushHistory(chatId, role, text) {
  const h = getHistory(chatId);
  h.push({ role, parts: [{ text }] });
  // Keep only the most recent turns (2 entries per turn: user + model).
  while (h.length > MAX_HISTORY_TURNS * 2) h.shift();
  history.set(chatId, h);
  lastActivity.set(chatId, Date.now());
}

function clearHistory(chatId) {
  history.delete(chatId);
  lastActivity.delete(chatId);
}

// Every distinct chat that has ever used the AI command keeps an entry
// here forever otherwise. Sweep out chats that have gone quiet for a
// long while so a long-running bot with many chats doesn't grow this
// without bound.
const STALE_MS = 24 * 60 * 60 * 1000;
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [chatId, last] of lastActivity) {
    if (now - last > STALE_MS) {
      history.delete(chatId);
      lastActivity.delete(chatId);
    }
  }
}, 60 * 60 * 1000);
if (sweepTimer.unref) sweepTimer.unref();

/**
 * Sends `prompt` to Gemini for the given chatId (used to key
 * conversation memory) and returns the model's reply as plain text.
 * Throws if GEMINI_API_KEY is not configured or the API call fails.
 */
async function askGemini(chatId, prompt) {
  if (!config.geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env file to use AI commands.'
    );
  }

  const contents = [...getHistory(chatId), { role: 'user', parts: [{ text: prompt }] }];

  const url = `${API_BASE}/${config.geminiModel}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.geminiApiKey,
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    logger.error({ status: response.status, errBody }, 'Gemini API request failed');
    throw new Error(`Gemini API error (${response.status}). Check your GEMINI_API_KEY and model name.`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

  if (!reply) {
    throw new Error('Gemini returned an empty response (it may have been blocked by safety filters).');
  }

  pushHistory(chatId, 'user', prompt);
  pushHistory(chatId, 'model', reply);

  return reply.trim();
}

module.exports = { askGemini, clearHistory };
