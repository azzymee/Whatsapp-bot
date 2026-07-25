# Phase 2 — AI, Moderation & Admin Commands

Builds directly on Phase 1. No files were removed; the following were
added or edited.

## New files
- `lib/ai.js` — Gemini `generateContent` wrapper (uses Node's built-in
  `fetch`, so **no new dependency** was added) with per-chat memory.
- `lib/settings.js` — per-group settings (welcome/goodbye/antilink/
  antispam/antidelete + message templates + strike counts), stored
  through `database/db.js`.
- `lib/messageStore.js` — in-memory cache of recent messages, used by
  anti-delete to know what was actually removed (WhatsApp's delete event
  only carries a reference, not the content).
- `lib/spamTracker.js` — in-memory sliding-window rate limiter for
  anti-spam.
- `commands/ai.js`, `commands/aireset.js`
- `commands/welcome.js`, `commands/goodbye.js`
- `commands/antilink.js`, `commands/antispam.js`, `commands/antidelete.js`
- `commands/kick.js`, `commands/promote.js`, `commands/demote.js`,
  `commands/mute.js`, `commands/unmute.js`, `commands/tagall.js`

## Edited files
- `utils/helpers.js` — added `isGroupAdmin`, `isBotAdmin`,
  `getGroupAdmins`, `isPrivileged`, `containsLink`, `resolveTargetJid`.
- `database/db.js` — added `keyFor(id)`. **Important fix:** JIDs contain
  dots (e.g. `123@g.us`), and the db's `get`/`set` treat `.` as a nesting
  separator. `keyFor()` sanitizes an id before it's used as a path
  segment so group/user data doesn't get corrupted.
- `config/config.js` — added `geminiModel` and `maxStrikes`.
- `events/index.js` — rewritten to also: cache every message (for
  anti-delete), detect revoke ("delete for everyone") notifications and
  re-post the original content, run anti-link/anti-spam checks on group
  messages before they reach the command handler, and listen for
  `group-participants.update` to send welcome/goodbye messages.
- `.env.example` — added `GEMINI_MODEL`, `ANTISPAM_MAX_MESSAGES`,
  `ANTISPAM_WINDOW_MS`, `MAX_STRIKES`.

## New commands

| Command | Who | Description |
|---|---|---|
| `.ai <text>` (aliases: `.gemini`, `.ask`, `.gpt`) | anyone | Chat with Gemini, with short conversation memory per chat |
| `.aireset` | anyone | Clears the AI memory for the current chat |
| `.welcome on\|off\|set <msg>` | admin/owner | Toggle/customize the join message (group only) |
| `.goodbye on\|off\|set <msg>` | admin/owner | Toggle/customize the leave message (group only) |
| `.antilink on\|off` | admin/owner | Auto-delete messages containing links/invite links |
| `.antispam on\|off` | admin/owner | Auto-delete messages sent too fast (flood) |
| `.antidelete on\|off` | admin/owner | Re-post messages that get deleted in the group |
| `.kick @user` | admin/owner | Removes a member (bot must be admin) |
| `.promote @user` | admin/owner | Makes a member an admin (bot must be admin) |
| `.demote @user` | admin/owner | Removes admin rights (bot must be admin) |
| `.mute` / `.unmute` | admin/owner | Admins-only messaging on/off (bot must be admin) |
| `.tagall [text]` | admin/owner | Mentions every group member |

Anti-link and anti-spam both escalate: each violation is a "strike"; once
a member hits `MAX_STRIKES` (default 3) and the bot is a group admin,
they're automatically removed. Group admins and the configured
`OWNER_NUMBERS` are always exempt.

## Setup

1. Get a free Gemini API key: https://aistudio.google.com/apikey
2. Open your `.env` file (created in Phase 1) and set:
   ```
   GEMINI_API_KEY=your_key_here
   ```
   The other new variables (`GEMINI_MODEL`, `ANTISPAM_*`, `MAX_STRIKES`)
   already have sensible defaults — only change them if you want to.

## Run it (Windows CMD)

```cmd
cd whatsapp-bot
npm install
npm start
```

No new npm packages were introduced in this phase, but running
`npm install` again is harmless and picks up anything missing.

## Quick test checklist

- `.ai hello` replies using Gemini
- `.antilink on` then post a link as a non-admin → message is deleted + warned
- `.antispam on` then send several messages quickly → message is deleted + warned
- `.antidelete on` then delete one of your own messages in the group → bot reposts it
- Add/remove a member from the group → welcome/goodbye message appears
- `.kick`, `.promote`, `.demote`, `.mute`, `.unmute`, `.tagall` all work when the bot is a group admin
