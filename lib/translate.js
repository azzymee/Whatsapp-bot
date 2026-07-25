// lib/translate.js
// Thin wrapper around Google Translate's public (unofficial) endpoint.
// No API key required. Uses Node's built-in fetch, same "raw fetch, no
// extra dependency" approach as lib/ai.js.

const logger = require('./logger');

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

/**
 * Translates `text` into `targetLang` (an ISO 639-1 code, e.g. "es",
 * "fr", "yo", "ha", "ig"). Auto-detects the source language.
 * Returns { translated, detectedSourceLang }.
 */
async function translateText(text, targetLang) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLang,
    dt: 't',
    q: text,
  });

  const response = await fetch(`${ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    logger.error({ status: response.status }, 'Translate request failed');
    throw new Error(`Translation service returned HTTP ${response.status}`);
  }

  const data = await response.json();
  // data[0] is an array of [translatedChunk, originalChunk, ...] tuples,
  // one per sentence/segment; join them back into one string.
  const translated = (data[0] || []).map((chunk) => chunk[0]).join('');
  const detectedSourceLang = data[2] || 'auto';

  if (!translated) {
    throw new Error('Got an empty translation back.');
  }

  return { translated, detectedSourceLang };
}

module.exports = { translateText };
