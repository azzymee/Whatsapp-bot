# Phase 4 — Games, Anime, Economy, Leveling, Plugin API & Final Optimization

Builds directly on Phase 1 + 2 + 3. No files were removed; the following
were added or edited.

## New files

**Economy**
- `lib/economy.js` — wallet/bank balances, transfers, deposits,
  withdrawals, cooldowns, leaderboard. All stored through
  `database/db.js` under `users.<id>.economy`.
- `commands/balance.js`, `commands/daily.js`, `commands/work.js`,
  `commands/rob.js`, `commands/pay.js`, `commands/deposit.js`,
  `commands/withdraw.js`, `commands/richest.js`

**Leveling**
- `lib/leveling.js` — XP awarded per group message (rate-limited per
  user so it can't be farmed by spamming), quadratic level curve,
  leaderboard. Stored under `users.<id>.leveling`.
- `commands/rank.js`, `commands/leaderboard.js`
- `events/index.js` now calls `leveling.awardMessageXp()` on every group
  message and announces level-ups (toggle with `LEVELING_ANNOUNCE`).

**Games**
- `lib/gameManager.js` — in-memory, per-chat game session tracker with
  auto-expiry, used by every stateful game below.
- `lib/triviaQuestions.js` — local trivia question bank (no API key).
- `commands/rps.js`, `commands/coinflip.js`, `commands/dice.js` —
  instant games.
- `commands/guess.js` — number guessing (`.guess start [max]` →
  `.guess <number>`).
- `commands/hangman.js` — classic hangman (`.hangman start` →
  `.hangman <letter>`).
- `commands/tictactoe.js` — two-player, turn-based (`.tictactoe
  @opponent` → `.tictactoe <1-9>`).
- `commands/trivia.js` — multiple choice (`.trivia` → `.trivia
  <A|B|C|D>`).
- Winning a game pays out coins through `lib/economy.js`.

**Anime**
- `lib/animeApi.js` — wraps waifu.pics (primary) and nekos.best
  (fallback) for reaction images, and Jikan (unofficial MyAnimeList API)
  for title search. All free, keyless, uses Node's built-in `fetch` —
  **no new dependency**.
- `commands/waifu.js`, `commands/neko.js`, `commands/pat.js`,
  `commands/hug.js`, `commands/kiss.js`, `commands/slap.js`,
  `commands/animesearch.js` (alias `.anime`)

**Plugin API**
- `lib/pluginLoader.js` — loads every `.js` file in `/plugins`. Each
  plugin can export `onMessage(ctx)` (fires on every incoming message,
  command or not), `onReady(sock)` (fires once on connect), and/or
  `commands: [...]` (registered exactly like a `commands/` file). This
  is the same `sock`/`db`/`config`/helpers access a command file has,
  wired up for cross-cutting behavior instead of a single `!command`.
- `plugins/autoReactions.js` — a real, working example plugin that
  implements auto-reactions (reacts with an emoji to trigger
  words/phrases like "good morning" or "thank you") entirely through
  the Plugin API, without touching `events/index.js`.
- `commands/plugins.js` (owner-only) — lists loaded plugins and what
  hooks/commands they register.
- `commands/reload.js` (owner-only) — reloads all commands and plugins
  from disk on demand, without restarting the bot.

## Edited files

- `lib/commandHandler.js` — added optional declarative flags any command
  can now set instead of writing manual permission checks:
  `ownerOnly`, `adminOnly`, `groupOnly`, `cooldown` (seconds). Commands
  from Phases 1-3 don't set these and still do their own manual checks
  inside `execute()` exactly as before — **fully backward compatible**.
  Also added `registerPluginCommand()`, used by `lib/pluginLoader.js`.
- `events/index.js` — hooked in leveling XP awards and
  `pluginLoader.runOnMessage()` for every incoming message.
- `lib/connection.js` — calls `pluginLoader.runOnReady(sock)` once the
  socket connects.
- `index.js` — loads plugins at startup (`loadAllPlugins()`) and adds
  graceful shutdown: `SIGINT`/`SIGTERM` now flush the database before
  exiting, so nothing sitting in the debounced write buffer is lost.
- `database/db.js` — **[optimization]** now keeps the parsed database in
  memory and debounces disk writes (250ms) instead of doing a full
  read-then-write on every single `get()`/`set()` call. Economy,
  leveling, and games all touch the database far more often than
  Phases 1-3 did, so this matters a lot more now. The public API
  (`get`/`set`/`all`/`keyFor`) is unchanged — nothing else needed to
  change. Added `flush()`, used by the graceful shutdown above.
- `config/config.js` — added `config.economy` and `config.leveling`
  blocks, plus `paths.plugins`.
- `.env.example` — added the corresponding `ECONOMY_*` and `LEVELING_*`
  variables.
- `package.json` — **no changes**. Everything in this phase uses either
  an existing dependency or Node's built-in `fetch`.

## New commands

| Command | Description |
|---|---|
| `.balance` (alias `.bal`, `.wallet`) | Shows wallet/bank/total balance |
| `.daily` | Claim a daily coin reward |
| `.work` | Work a random job for coins (cooldown) |
| `.rob @user` | Attempt to steal coins from someone's wallet |
| `.pay @user <amount>` (alias `.transfer`) | Send coins to another user |
| `.deposit <amount\|all>` (alias `.dep`) | Wallet → bank (safe from `.rob`) |
| `.withdraw <amount\|all>` (alias `.wd`) | Bank → wallet |
| `.richest` | Top 10 richest users |
| `.rank` (alias `.level`, `.xp`) | Your level/XP progress |
| `.leaderboard` (alias `.lb`, `.topxp`) | Top 10 by level/XP |
| `.rps <rock\|paper\|scissors>` | Rock-paper-scissors vs the bot |
| `.coinflip <heads\|tails> [amount]` (alias `.flip`) | Coin flip, optional bet |
| `.dice [sides]` (alias `.roll`) | Roll a dice |
| `.guess start [max]` / `.guess <number>` | Number guessing game |
| `.hangman start` / `.hangman <letter>` | Hangman |
| `.tictactoe @opponent` / `.tictactoe <1-9>` (alias `.ttt`) | Two-player tic-tac-toe |
| `.trivia` / `.trivia <A\|B\|C\|D>` | Multiple-choice trivia |
| `.waifu`, `.neko` | Random anime images |
| `.pat`, `.hug`, `.kiss`, `.slap` `[@user]` | Reaction gifs, optionally directed at someone |
| `.anime <title>` | Anime info lookup (Jikan/MyAnimeList) |
| `.plugins` (owner) | Lists loaded plugins |
| `.reload` (owner) | Reloads commands + plugins without restarting |

All economy/game payouts and cooldowns are configurable in `.env` — see
the new `ECONOMY_*` / `LEVELING_*` section in `.env.example`.

## Setup

Nothing new to install — this phase adds **zero new npm dependencies**.

## Run it (Windows CMD)

```cmd
cd whatsapp-bot
npm install
npm start
```

Try it out:
```
!daily
!work
!balance
!rps rock
!guess start
!guess 50
!hangman start
!tictactoe @someone
!trivia
!waifu
!anime Naruto
!rank
!leaderboard
```

Owner-only (set `OWNER_NUMBERS` in `.env` first):
```
!plugins
!reload
```

## A note on the Plugin API

`/plugins` is deliberately separate from `/commands`. A command file
handles one `!command`; a plugin can react to *any* message, run logic
when the bot connects, and/or register its own commands — all through
the same `sock`, `db`, `config`, and `utils/helpers` every command
already uses. `plugins/autoReactions.js` is a complete, working example:
delete that one file and auto-reactions are gone, with nothing else to
touch. Drop a new `.js` file into `/plugins` (or run `.reload`) to add
your own.
