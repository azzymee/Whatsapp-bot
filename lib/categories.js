// lib/categories.js
// Single source of truth for category display metadata (emoji, label,
// and menu ordering). commands/menu.js and lib/commandHandler.js both
// read from here so category styling never has to be duplicated or
// hardcoded per file — add a new category here and it just works.

const CATEGORIES = {
  general: { emoji: '⚙️', label: 'General', order: 0 },
  anime: { emoji: '🌸', label: 'Anime', order: 1 },
  games: { emoji: '🎮', label: 'Games', order: 2 },
  ai: { emoji: '🤖', label: 'AI', order: 3 },
  economy: { emoji: '💰', label: 'Economy', order: 4 },
  leveling: { emoji: '📈', label: 'Leveling', order: 5 },
  admin: { emoji: '🛡️', label: 'Admin', order: 6 },
  utility: { emoji: '🛠️', label: 'Utility', order: 7 },
  downloader: { emoji: '📥', label: 'Downloader', order: 8 },
  sticker: { emoji: '🖼️', label: 'Sticker', order: 9 },
  owner: { emoji: '👑', label: 'Owner', order: 10 },
};

const FALLBACK = { emoji: '📦', label: 'Other', order: 999 };

/** Returns the { emoji, label, order } metadata for a category key. */
function getCategory(key) {
  return CATEGORIES[key] || { ...FALLBACK, label: key ? capitalize(key) : FALLBACK.label };
}

/** Returns "🌸 Anime" style display string for a category key. */
function formatCategory(key) {
  const meta = getCategory(key);
  return `${meta.emoji} ${meta.label}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { CATEGORIES, getCategory, formatCategory };
