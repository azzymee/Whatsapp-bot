// commands/menu.js
// Auto-generates the menu from whatever commands are currently loaded
// and each command's metadata (category, emoji), so it never goes
// stale and nothing here is hardcoded.

const config = require('../config/config');
const { getCategory } = require('../lib/categories');

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

module.exports = {
  name: 'menu',
  emoji: '📜',
  aliases: ['help', 'commands'],
  category: 'general',
  description: 'Shows all available commands grouped by category.',
  usage: '.menu',
  noTyping: true,
  async execute({ sock, from, prefix }) {
    // Lazy require to avoid a circular require at module load time
    // (commandHandler requires this file indirectly via loadAllCommands).
    const { getCommands } = require('../lib/commandHandler');
    const all = getCommands();

    const seen = new Set();
    const byCategory = new Map();

    for (const cmd of all.values()) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);
      const key = cmd.category || 'general';
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key).push(cmd);
    }

    const sortedCategories = [...byCategory.entries()].sort(
      (a, b) => getCategory(a[0]).order - getCategory(b[0]).order
    );

    const owner = config.ownerNumbers[0] ? `+${config.ownerNumbers[0]}` : 'Not set';

    let text = '╭━━━━━━━━━━━━━━━━━━━━━━╮\n';
    text += `┃ 🌸 *${config.botName}*\n`;
    text += '┣━━━━━━━━━━━━━━━━━━━━━━┫\n';
    text += `┃ 🤖 Prefix   : ${prefix}\n`;
    text += `┃ ⚡ Status   : Online\n`;
    text += `┃ ⏱ Uptime   : ${formatUptime(process.uptime())}\n`;
    text += `┃ 📦 Commands : ${seen.size}\n`;
    text += `┃ 👑 Owner    : ${owner}\n`;
    text += '╰━━━━━━━━━━━━━━━━━━━━━━╯\n';

    for (const [key, cmds] of sortedCategories) {
      const { emoji, label } = getCategory(key);
      text += `\n${emoji} *${label}*\n`;
      for (const cmd of cmds.sort((a, b) => a.name.localeCompare(b.name))) {
        text += `${cmd.emoji || '▫️'} ${cmd.name}\n`;
      }
    }

    await sock.sendMessage(from, { text: text.trim() });
  },
};
