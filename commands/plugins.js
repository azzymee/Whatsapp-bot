// commands/plugins.js

const { getPlugins } = require('../lib/pluginLoader');

module.exports = {
  name: 'plugins',
  emoji: '🔌',
  category: 'owner',
  ownerOnly: true,
  description: 'Lists all currently loaded plugins from the /plugins directory.',
  usage: '.plugins',
  async execute({ sock, from }) {
    const plugins = getPlugins();
    if (plugins.size === 0) {
      await sock.sendMessage(from, { text: 'No plugins are currently loaded. Add a .js file to /plugins and restart (or use .reload).' });
      return;
    }

    const lines = [...plugins.values()].map((p) => {
      const hooks = [];
      if (typeof p.onMessage === 'function') hooks.push('onMessage');
      if (typeof p.onReady === 'function') hooks.push('onReady');
      if (Array.isArray(p.commands) && p.commands.length) hooks.push(`commands: ${p.commands.map((c) => c.name).join(', ')}`);
      return `• *${p.name}* — ${p.description || 'no description'}\n   hooks: ${hooks.join(' | ') || 'none'}`;
    });

    await sock.sendMessage(from, { text: `🔌 *Loaded Plugins (${plugins.size})*\n\n${lines.join('\n\n')}` });
  },
};
