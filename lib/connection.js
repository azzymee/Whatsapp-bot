// lib/connection.js
// Owns the Baileys socket lifecycle: auth state, QR display, connection
// events, and auto reconnect with the correct handling of the "logged
// out" case (which must NOT auto reconnect, since the session is dead).

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const qrcode = require('qrcode-terminal');
const logger = require('./logger');
const config = require('../config/config');
const { registerEvents } = require('../events');
const { runOnReady, getPlugins } = require('./pluginLoader');
const { getUniqueCommandCount } = require('./commandHandler');
const { printReadyBanner } = require('./banner');

const SESSION_DIR = path.join(__dirname, '..', config.paths.sessions);
let pairingCodeRequested = false;
async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const usePairingCode = !state.creds.registered;
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.debug(`Using Baileys version ${version.join('.')}, latest: ${isLatest}`);

  const sock = makeWASocket({
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    version,
    auth: state,
    logger: logger.child({ module: 'baileys' }),
    printQRInTerminal: false, // we handle QR rendering ourselves below
    browser: [config.botName, 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: true,
  });
  if (usePairingCode && !pairingCodeRequested) {
    pairingCodeRequested = true;
    setTimeout(async () => {
      if (sock.authState.creds.registered) {
        logger.info('Already registered by the time the timer fired, skipping pairing code request.');
        return;
      }
      try {
        const phoneNumber = '2348114604706';
        const code = await sock.requestPairingCode(phoneNumber);
        logger.info(`Your WhatsApp pairing code is: ${code}`);
      } catch (err) {
        logger.error({ err }, 'Failed to get pairing code');
        pairingCodeRequested = false;
      }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('Scan the QR code below with WhatsApp (Linked Devices):');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      logger.warn(
        { statusCode, loggedOut },
        'Connection closed'
      );

      if (loggedOut) {
        logger.error(
          'Session was logged out from the phone. Delete the sessions/ folder and restart to log in again.'
        );
        return;
      }

      logger.info('Reconnecting...');
      startSocket().catch((err) => logger.error({ err }, 'Reconnect attempt failed'));
    } else if (connection === 'open') {
      logger.debug(`Connected as ${sock.user?.id || 'unknown'}`);
      printReadyBanner({
        botName: config.botName,
        commandCount: getUniqueCommandCount(),
        pluginCount: getPlugins().size,
        prefix: config.prefixes[0],
      });
      runOnReady(sock).catch((err) => logger.error({ err }, 'Plugin onReady() batch failed'));
    }
  });

  // Registered here, per socket instance, instead of once in index.js.
  // Baileys frequently closes and re-opens the connection right after a
  // fresh QR pairing (DisconnectReason.restartRequired), which causes a
  // brand new socket to be created by the reconnect branch above. Any
  // listeners attached only to the socket index.js originally received
  // would silently stop receiving events after that happens.
  registerEvents(sock);

  return sock;
}

module.exports = { startSocket };
