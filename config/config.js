// config/config.js
// Central place for all bot configuration. Every other file should read
// settings from here instead of touching process.env directly.

// dotenv is loaded once in index.js before this file is required anywhere.

function parseList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

const config = {
  botName: process.env.BOT_NAME || 'MyBot',
  prefixes: process.env.PREFIXES ? parseList(process.env.PREFIXES) : ['!', '.', '/'],
  ownerNumbers: parseList(process.env.OWNER_NUMBERS),
  logLevel: process.env.LOG_LEVEL || 'info',

  // Phase 2+ keys, safe to be empty for now
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  weatherApiKey: process.env.WEATHER_API_KEY || '',
  maxStrikes: Number(process.env.MAX_STRIKES) || 3,

  // ---- Phase 3 ----
  // Downloader commands (ytmp3/ytmp4/tiktok/instagram) abort past this size.
  maxDownloadMB: Number(process.env.MAX_DOWNLOAD_MB) || 50,
  // Shown as the "pack" WhatsApp displays for stickers made by .sticker
  stickerPackName: process.env.STICKER_PACK_NAME || process.env.BOT_NAME || 'MyBot',
  stickerAuthor: process.env.STICKER_AUTHOR || 'WhatsApp Bot',

  // ---- Phase 4 ----
  economy: {
    currencySymbol: process.env.CURRENCY_SYMBOL || '$',
    dailyAmount: Number(process.env.ECONOMY_DAILY_AMOUNT) || 500,
    dailyCooldownMs: (Number(process.env.ECONOMY_DAILY_COOLDOWN_HOURS) || 24) * 60 * 60 * 1000,
    workMin: Number(process.env.ECONOMY_WORK_MIN) || 50,
    workMax: Number(process.env.ECONOMY_WORK_MAX) || 300,
    workCooldownMs: (Number(process.env.ECONOMY_WORK_COOLDOWN_MINUTES) || 30) * 60 * 1000,
    robCooldownMs: (Number(process.env.ECONOMY_ROB_COOLDOWN_HOURS) || 6) * 60 * 60 * 1000,
    robSuccessChance: Number(process.env.ECONOMY_ROB_SUCCESS_CHANCE) || 0.4,
    robMinTargetWallet: Number(process.env.ECONOMY_ROB_MIN_TARGET_WALLET) || 100,
  },

  leveling: {
    xpMin: Number(process.env.LEVELING_XP_MIN) || 10,
    xpMax: Number(process.env.LEVELING_XP_MAX) || 25,
    // Minimum time between XP awards for the same user, so spamming
    // messages can't be used to farm levels.
    xpCooldownMs: (Number(process.env.LEVELING_XP_COOLDOWN_SECONDS) || 60) * 1000,
    // If true, sends a "leveled up" message in the chat when it happens.
    announceLevelUp: (process.env.LEVELING_ANNOUNCE ?? 'true') !== 'false',
  },

  paths: {
    sessions: 'sessions',
    media: 'media',
    database: 'database',
    commands: 'commands',
    plugins: 'plugins',
  },
};

module.exports = config;
