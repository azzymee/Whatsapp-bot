// lib/banner.js
// A small, dependency-light banner printer for a clean startup console.
// This is deliberately separate from lib/logger.js: pino-pretty already
// covers structured operational logging (with timestamps, levels, and
// file transport if ever configured), while this is a one-off visual
// summary meant to be read by a human watching the terminal, not parsed.

const chalk = require('chalk');

const WIDTH = 34;
const LINE = '═'.repeat(WIDTH);

/** Shown immediately on boot, before commands/plugins/socket are ready. */
function printBootBanner(botName) {
  console.log(chalk.cyanBright(LINE));
  console.log(chalk.bold.magentaBright(`  🌸 ${botName}`));
  console.log(chalk.cyanBright(LINE));
}

/**
 * Shown once the bot is fully up: commands + plugins loaded and the
 * WhatsApp socket connected. This is the "Ready" summary from Phase 6.
 */
function printReadyBanner({ botName, commandCount, pluginCount, prefix }) {
  console.log('');
  console.log(chalk.cyanBright(LINE));
  console.log(chalk.bold.magentaBright(`  🌸 ${botName}`));
  console.log(chalk.cyanBright(LINE));
  console.log(chalk.green(`  ✅ Commands Loaded : ${commandCount}`));
  console.log(chalk.yellow(`  ⚡ Prefix          : ${prefix}`));
  console.log(chalk.blueBright(`  🌐 WhatsApp Connected`));
  console.log(chalk.magenta(`  📦 Plugins Loaded  : ${pluginCount}`));
  console.log(chalk.greenBright.bold(`  🟢 Ready`));
  console.log(chalk.cyanBright(LINE));
  console.log('');
}

module.exports = { printBootBanner, printReadyBanner };
