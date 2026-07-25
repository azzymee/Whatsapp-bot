// lib/commandHandler.js
// Loads every command file from /commands and dispatches incoming
// messages to the right one. Supports hot reload: call reloadCommand()
// or reloadAll() at runtime and changes take effect immediately.

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const cooldown = require('./cooldown');
const ui = require('../utils/ui');
const { parseCommand, extractMessageText, isOwner, isGroupAdmin, isBotAdmin } = require('../utils/helpers');

const COMMANDS_DIR = path.join(__dirname, '..', 'commands');

// name/alias -> command object
const commands = new Map();
// file path -> command name, so we know what to drop on reload
const fileToCommand = new Map();

function validateCommand(cmd, file) {
  if (!cmd || typeof cmd !== 'object') {
    throw new Error(`Command file ${file} must export an object`);
  }
  if (!cmd.name || typeof cmd.name !== 'string') {
    throw new Error(`Command file ${file} is missing a string "name"`);
  }
  if (typeof cmd.execute !== 'function') {
    throw new Error(`Command file ${file} is missing an "execute" function`);
  }
}

function registerCommand(cmd, file) {
  commands.set(cmd.name.toLowerCase(), cmd);
  if (Array.isArray(cmd.aliases)) {
    for (const alias of cmd.aliases) {
      commands.set(alias.toLowerCase(), cmd);
    }
  }
  fileToCommand.set(file, cmd.name.toLowerCase());
}

function unregisterByFile(file) {
  const existing = fileToCommand.get(file);
  if (!existing) return;
  const cmd = commands.get(existing);
  if (cmd) {
    commands.delete(cmd.name.toLowerCase());
    if (Array.isArray(cmd.aliases)) {
      for (const alias of cmd.aliases) commands.delete(alias.toLowerCase());
    }
  }
  fileToCommand.delete(file);
}

function loadCommandFile(file) {
  const fullPath = path.join(COMMANDS_DIR, file);
  try {
    delete require.cache[require.resolve(fullPath)];
    const cmd = require(fullPath);
    validateCommand(cmd, file);
    unregisterByFile(file);
    registerCommand(cmd, file);
    logger.debug(`Loaded command: ${cmd.name} (${file})`);
    return true;
  } catch (err) {
    logger.error({ err }, `Failed to load command file ${file}`);
    return false;
  }
}

/**
 * Registers a command coming from a plugin (see lib/pluginLoader.js)
 * rather than a file in commands/. Reuses the exact same validation and
 * storage as file-based commands, just keyed under a synthetic
 * "plugin:<pluginName>:<cmdName>" label so hot-reload of commands/
 * (which only watches COMMANDS_DIR) can never touch it.
 */
function registerPluginCommand(cmd, pluginName) {
  const label = `plugin:${pluginName}:${cmd?.name}`;
  validateCommand(cmd, label);
  registerCommand(cmd, label);
  logger.debug(`Loaded command: ${cmd.name} (from plugin "${pluginName}")`);
}

function loadAllCommands() {
  commands.clear();
  fileToCommand.clear();

  if (!fs.existsSync(COMMANDS_DIR)) {
    logger.warn('commands/ directory does not exist, creating it');
    fs.mkdirSync(COMMANDS_DIR, { recursive: true });
    return;
  }

  const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    loadCommandFile(file);
  }
  logger.debug(`Loaded ${commands.size} command entries (including aliases) from ${files.length} files`);
}

/**
 * Hot reload: watches the commands directory and reloads a file the
 * moment it changes on disk. Safe to call once at startup.
 */
function watchCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) return;
  fs.watch(COMMANDS_DIR, { persistent: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.js')) return;
    const fullPath = path.join(COMMANDS_DIR, filename);
    if (!fs.existsSync(fullPath)) {
      unregisterByFile(filename);
      logger.info(`Command file removed: ${filename}`);
      return;
    }
    // Small debounce so editors that write files in multiple steps
    // (common on Windows) don't trigger a broken partial reload.
    setTimeout(() => loadCommandFile(filename), 150);
  });
  logger.debug('Hot reload watcher active on commands/');
}

/**
 * Main dispatch entry point, called from the message event with the raw
 * Baileys message object plus the active socket.
 */
async function handleMessage(sock, msg) {
  const messageContent = msg.message;
  if (!messageContent) return;

  const text = extractMessageText(messageContent);
  const parsed = parseCommand(text);
  if (!parsed) return;

  const cmd = commands.get(parsed.command);
  if (!cmd) return;

  const from = msg.key.remoteJid;
  const isGroup = from.endsWith('@g.us');
  const sender = msg.key.participant || msg.key.remoteJid;

  // ---- Declarative permission/cooldown flags (optional, opt-in) ----
  // Commands from Phase 1-3 don't set these and do their own manual
  // checks inside execute() as before — unaffected. Newer commands can
  // set these instead of repeating the same boilerplate.
  if (cmd.groupOnly && !isGroup) {
    await sock.sendMessage(from, ui.fail(`*${cmd.name}* only works in groups.`));
    return;
  }
  if (cmd.ownerOnly && !isOwner(sender)) {
    await sock.sendMessage(from, ui.fail(`*${cmd.name}* can only be used by the bot owner.`));
    return;
  }
  if (cmd.adminOnly && isGroup) {
    const allowed = isOwner(sender) || (await isGroupAdmin(sock, from, sender).catch(() => false));
    if (!allowed) {
      await sock.sendMessage(from, ui.fail(`*${cmd.name}* can only be used by group admins.`));
      return;
    }
  }
  if (cmd.botAdminRequired && isGroup) {
    const botIsAdmin = await isBotAdmin(sock, from).catch(() => false);
    if (!botIsAdmin) {
      await sock.sendMessage(from, ui.fail('I need to be a group admin to do that.'));
      return;
    }
  }
  if (cmd.cooldown) {
    const remaining = cooldown.check(cmd.name, sender, cmd.cooldown);
    if (remaining > 0) {
      await sock.sendMessage(from, { text: `${ui.EMOJI.cooldown} *${cmd.name}* is on cooldown. Try again in ${remaining}s.` });
      return;
    }
  }

  // Shows "typing…" in the chat while the command does its work, unless
  // the command opts out (e.g. games with instant replies where the
  // flicker would look odd). Cleared again once execute() settles,
  // whether it succeeded or threw.
  if (!cmd.noTyping) await ui.typing(sock, from);

  try {
    await cmd.execute({
      sock,
      msg,
      from,
      sender,
      isGroup,
      args: parsed.args,
      text: parsed.text,
      prefix: parsed.prefix,
    });
  } catch (err) {
    logger.error({ err, command: cmd.name }, 'Command execution failed');
    try {
      await sock.sendMessage(from, ui.fail(`Something went wrong running *${cmd.name}*. Give it another try in a moment.`));
    } catch (sendErr) {
      logger.error({ sendErr }, 'Failed to send error message to chat');
    }
  } finally {
    if (!cmd.noTyping) await ui.stopTyping(sock, from);
  }
}

function getCommands() {
  return commands;
}

/**
 * Number of distinct commands (by cmd.name), ignoring the extra Map
 * entries created for aliases. Used by the Phase 6 ready banner instead
 * of commands.size, which would double-count anything with aliases.
 */
function getUniqueCommandCount() {
  const seen = new Set();
  for (const cmd of commands.values()) seen.add(cmd.name);
  return seen.size;
}

module.exports = {
  loadAllCommands,
  watchCommands,
  handleMessage,
  getCommands,
  getUniqueCommandCount,
  registerPluginCommand,
};
