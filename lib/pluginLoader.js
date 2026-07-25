// lib/pluginLoader.js
// Loads third-party-style plugins from /plugins. A plugin is a single
// .js file (CommonJS) exporting a plain object:
//
//   module.exports = {
//     name: 'my-plugin',            // required, unique
//     description: 'What it does',  // optional, shown in .plugins
//     commands: [ { name, execute, ... } ],   // optional, same shape as
//                                              // a commands/ file
//     async onMessage(ctx) { ... }, // optional, called for every
//                                    // incoming message (see below)
//     async onReady(sock) { ... },  // optional, called once the socket
//                                    // connects
//   }
//
// This is the same "Plugin API" a command file uses (sock, db, config,
// helpers) but wired up for cross-cutting behavior instead of a single
// `!command`. It's how features like auto-reactions are built without
// editing events/index.js by hand for every new idea.
//
// onMessage(ctx) receives:
//   { sock, msg, from, sender, isGroup, text, isCommand }
// `isCommand` is true if the message was already recognized as a
// `!command` and dispatched to commandHandler — useful if a plugin only
// wants to react to plain chat, not commands.

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const commandHandler = require('./commandHandler');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');

// name -> plugin object
const plugins = new Map();

function loadAllPlugins() {
  plugins.clear();

  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    return;
  }

  const files = fs.readdirSync(PLUGINS_DIR).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const fullPath = path.join(PLUGINS_DIR, file);
    try {
      delete require.cache[require.resolve(fullPath)];
      const plugin = require(fullPath);

      if (!plugin || typeof plugin !== 'object' || !plugin.name) {
        throw new Error(`Plugin file ${file} must export an object with a "name"`);
      }
      if (plugins.has(plugin.name)) {
        throw new Error(`Duplicate plugin name "${plugin.name}" (from ${file})`);
      }

      if (Array.isArray(plugin.commands)) {
        for (const cmd of plugin.commands) {
          commandHandler.registerPluginCommand(cmd, plugin.name);
        }
      }

      plugins.set(plugin.name, plugin);
      logger.debug(`Loaded plugin: ${plugin.name} (${file})`);
    } catch (err) {
      logger.error({ err }, `Failed to load plugin file ${file}`);
    }
  }

  logger.debug(`Loaded ${plugins.size} plugin(s) from ${PLUGINS_DIR}`);
}

/**
 * Calls onReady(sock) on every loaded plugin, once the socket connects.
 * Failures in one plugin don't stop the others from running.
 */
async function runOnReady(sock) {
  for (const plugin of plugins.values()) {
    if (typeof plugin.onReady !== 'function') continue;
    try {
      await plugin.onReady(sock);
    } catch (err) {
      logger.error({ err, plugin: plugin.name }, 'Plugin onReady() threw');
    }
  }
}

/**
 * Calls onMessage(ctx) on every loaded plugin for a single incoming
 * message. Failures in one plugin don't stop the others from running.
 */
async function runOnMessage(ctx) {
  for (const plugin of plugins.values()) {
    if (typeof plugin.onMessage !== 'function') continue;
    try {
      await plugin.onMessage(ctx);
    } catch (err) {
      logger.error({ err, plugin: plugin.name }, 'Plugin onMessage() threw');
    }
  }
}

function getPlugins() {
  return plugins;
}

module.exports = { loadAllPlugins, runOnReady, runOnMessage, getPlugins };
