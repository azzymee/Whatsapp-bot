// lib/logger.js
// Single shared pino logger instance used everywhere, including by Baileys
// itself (Baileys requires a pino-compatible logger).

const pino = require('pino');
const config = require('../config/config');

const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

module.exports = logger;
