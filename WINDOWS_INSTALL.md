# Windows Installation Guide (Phase 1)

Exact commands to run in **Command Prompt (CMD)**. PowerShell works too, but
these are written for plain CMD.

## 1. Install Node.js

Download and install the LTS version from https://nodejs.org (18.x or newer).
Confirm it installed correctly:

```
node -v
npm -v
```

Both should print a version number.

## 2. Extract the project

Extract the downloaded zip somewhere simple, for example:

```
C:\whatsapp-bot
```

Open CMD and move into that folder:

```
cd C:\whatsapp-bot
```

## 3. Create your .env file

```
copy .env.example .env
```

Open `.env` in Notepad if you want to change the prefix or bot name:

```
notepad .env
```

## 4. Install dependencies

```
npm install
```

This downloads Baileys and the other packages listed in `package.json`. It
can take a minute or two the first time.

## 5. Start the bot

```
npm start
```

## 6. Scan the QR code

A QR code appears directly in the CMD window. On your phone:

**WhatsApp → Settings → Linked Devices → Link a Device**, then scan it.

Once you see `Connected as ...` in the terminal, the bot is live. Try
sending `!menu` or `!ping` to it from any chat.

## Stopping the bot

Press `CTRL + C` in the CMD window.

## Restarting later

You do not need to scan the QR code again unless you deleted the
`sessions` folder or logged the device out from your phone:

```
cd C:\whatsapp-bot
npm start
```

## Common issues

**`node` is not recognized as an internal or external command**
Node.js isn't installed, or you need to restart CMD (or your PC) after
installing it so the PATH updates.

**`npm install` fails with permission errors**
Right-click Command Prompt and choose "Run as administrator", then
re-run `npm install`.

**QR code looks broken/garbled in the terminal**
Resize the CMD window wider before starting the bot, or use Windows
Terminal instead of classic CMD for better QR rendering.

**Bot disconnects repeatedly**
Check your internet connection. The bot auto-reconnects on drops, but
repeated disconnects usually mean the phone lost its own connection —
open WhatsApp on the phone and make sure it's online.
