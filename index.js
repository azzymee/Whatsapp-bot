// index.js
// Entry point. Loads env vars first (must happen before anything else
// requires config.js), then boots the command loader, event listeners,
// and the Baileys socket.

require('dotenv').config();

const logger = require('./lib/logger');
const config = require('./config/config');
const db = require('./database/db');
const { startSocket } = require('./lib/connection');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

// If Railway gave us a saved session (SESSION_DATA), unpack it into
// sessions/ before starting the socket, so the bot logs in automatically
// without needing a fresh QR/pairing code.
function restoreSessionFromEnv() {
  logger.info(`SESSION_DATA present: ${!!process.env.SESSION_DATA}, length: ${(process.env.SESSION_DATA || '').length}`);
  const sessionDir = path.join(__dirname, 'sessions');
  const alreadyHasSession = fs.existsSync(path.join(sessionDir, 'creds.json'));

  if (!alreadyHasSession && process.env.SESSION_DATA) {
    logger.info('Restoring WhatsApp session from SESSION_DATA...');
    const buffer = Buffer.from(process.env.SESSION_DATA, 'base64');
    const zipPath = path.join(__dirname, 'session-restore.zip');
    fs.writeFileSync(zipPath, buffer);

    const zip = new AdmZip(zipPath);
    fs.mkdirSync(sessionDir, { recursive: true });
    zip.extractAllTo(sessionDir, true);
    fs.unlinkSync(zipPath);

    logger.info('Session restored successfully.');
  }
}
const { loadAllCommands, watchCommands } = require('./lib/commandHandler');
const { loadAllPlugins } = require('./lib/pluginLoader');
const { printBootBanner } = require('./lib/banner');

let shuttingDown = false;

/**
 * Flushes the database and exits. Registered against SIGINT/SIGTERM so
 * `Ctrl+C` (or a process manager stopping the bot) never loses whatever
 * economy/leveling/settings changes were still sitting in the debounced
 * write buffer (see database/db.js).
 */
function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}, shutting down gracefully...`);
  try {
    db.flush();
    logger.info('Database flushed to disk.');
  } catch (err) {
    logger.error({ err }, 'Failed to flush database during shutdown');
  }
  process.exit(0);
}

async function main() {
  printBootBanner(config.botName);
  logger.debug(`Starting ${config.botName}...`);

  loadAllCommands();
  watchCommands();
  loadAllPlugins();

  // Event listeners (including message handling) are registered inside
  // startSocket() itself, once per socket instance — see lib/connection.js.
  // The "ready" banner (commands/plugins/connection summary) is printed
  // from lib/connection.js once the socket actually reaches "open",
  // since that's the last of the three things to become true.
 restoreSessionFromEnv();
  await startSocket();

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
  });
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error during startup');
  process.exit(1);
});
