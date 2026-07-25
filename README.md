# WhatsApp Bot — Phase 1

Modular WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys). This is
**Phase 1** of a multi-phase build: connection, QR login, auto reconnect,
and a hot-reloading command system. Later phases add AI chat, moderation,
downloaders, games, and more, without ever touching the files here.

## Project structure

```
whatsapp-bot/
├── commands/          # one file per command (ping.js, menu.js, ...)
├── events/            # non-message event listeners (welcome, anti-delete, ...)
├── lib/                # core engine: connection, logger, command handler
├── config/             # config.js reads and validates .env
├── database/           # JSON database (db.json + db.js wrapper)
├── utils/               # shared helper functions
├── sessions/            # Baileys auth state — gitignored, created on first run
├── media/                # temp media storage — gitignored
├── index.js              # entry point
├── package.json
└── .env.example
```

## What's included in Phase 1

- QR-code login via the terminal (WhatsApp → Linked Devices)
- Persistent session storage in `sessions/`, so you don't re-scan every restart
- Auto reconnect on any connection drop that isn't a manual logout
- A command loader that reads every file in `commands/`
- Hot reload: edit or add a file in `commands/` while the bot is running and it reloads automatically, no restart needed
- Multi-prefix support (`!`, `.`, `/` by default, configurable in `.env`)
- A JSON-file database wrapper (`database/db.js`) with a `get/set/all` API, designed to be swapped for SQLite later without changing any command
- Two working commands: `ping` and `menu`

## Setup

1. Install [Node.js 18 or newer](https://nodejs.org).
2. Extract this project folder and open a terminal inside it.
3. Copy `.env.example` to `.env` and fill in what you have so far (`OWNER_NUMBERS` is optional at this stage).
4. Install dependencies:
   ```
   npm install
   ```
5. Start the bot:
   ```
   npm start
   ```
6. A QR code will print in the terminal. On your phone: **WhatsApp → Settings → Linked Devices → Link a Device**, then scan it.
7. Once connected, message the bot from any chat with `!ping` or `!menu`.

Windows users: see `WINDOWS_INSTALL.md` for exact CMD commands.

## Adding a command

Every file in `commands/` must export an object with at least `name` and
`execute`:

```js
module.exports = {
  name: 'hello',
  aliases: ['hi'],
  category: 'general',
  description: 'Says hello.',
  async execute({ sock, from }) {
    await sock.sendMessage(from, { text: 'Hello!' });
  },
};
```

Drop the file into `commands/` and it loads automatically, no restart
required.

## Notes

- `sessions/` holds your login credentials in plain files. Never share this folder or commit it to git — it is already in `.gitignore`.
- If you get logged out from your phone, delete the contents of `sessions/` and restart the bot to get a fresh QR code.
- This project uses an unofficial WhatsApp API (Baileys). Automating WhatsApp this way is against WhatsApp's Terms of Service and account bans are possible; use a secondary/test number, not your primary one.

## Coming in later phases

- Phase 2: AI chat, welcome/goodbye, anti-link, anti-delete, anti-spam, admin commands
- Phase 3: sticker maker, downloaders, translation, weather, utilities
- Phase 4: games, anime, economy, leveling, plugin API, final optimization
