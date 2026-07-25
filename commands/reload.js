// commands/reload.js
// Manually re-runs the same loaders the bot uses on startup. The hot
// reload watcher (lib/commandHandler.js's watchCommands()) already
// picks up single-file changes under commands/ automatically; this
// command is for a full reload (e.g. after editing several files at
// once, or after adding/removing plugins, which aren't file-watched).

const { loadAllCommands, getCommands } = require('../lib/commandHandler');
const { loadAllPlugins, getPlugins } = require('../lib/pluginLoader');

module.exports = {
  name: 'reload',
  emoji: '♻️',
  category: 'owner',
  ownerOnly: true,
  description: 'Reloads all commands and plugins from disk without restarting the bot.',
  usage: '.reload',
  async execute({ sock, from }) {
    try {
      loadAllCommands();
      loadAllPlugins();
      const commandCount = getCommands().size;
      const pluginCount = getPlugins().size;
      await sock.sendMessage(from, {
        text: `♻️ Reloaded successfully.\nCommands (incl. aliases): ${commandCount}\nPlugins: ${pluginCount}`,
      });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Reload failed: ${err.message}` });
    }
  },
};
