# Phase 3 — Sticker Maker, Downloaders, Translation, Weather & Utilities

Builds directly on Phase 1 + 2. No files were removed; the following were
added or edited.

## New files
- `lib/downloader.js` — shared helpers used by every downloader command:
  streams a URL or a Web ReadableStream into a size-capped temp file
  under `media/`, transcodes audio to a real `.mp3` with the bundled
  ffmpeg binary, extracts YouTube video IDs from URLs, and cleans up
  temp files afterward.
- `lib/translate.js` — Google Translate public-endpoint wrapper (uses
  Node's built-in `fetch`, same pattern as `lib/ai.js`, **no new
  dependency**).
- `commands/sticker.js`, `commands/toimg.js` — image/video ⇄ sticker.
- `commands/ytmp3.js`, `commands/ytmp4.js` — YouTube audio/video
  downloader (via `youtubei.js`).
- `commands/tiktok.js` — TikTok downloader (via the public tikwm.com API).
- `commands/instagram.js` — Instagram post/reel downloader (via
  `instagram-url-direct`).
- `commands/translate.js`, `commands/weather.js`
- `commands/shorturl.js`, `commands/qrcode.js`, `commands/calc.js`,
  `commands/base64.js`, `commands/tts.js`

## Edited files
- `utils/helpers.js` — added `getQuotedOrDirectMessage()`, used by
  `.sticker`/`.toimg` to resolve either the replied-to message or the
  message the command itself was sent with.
- `config/config.js` — added `maxDownloadMB`, `stickerPackName`,
  `stickerAuthor`.
- `.env.example` — added `MAX_DOWNLOAD_MB`, `STICKER_PACK_NAME`,
  `STICKER_AUTHOR`.
- `package.json` — added `sharp`, `node-webpmux`, `fluent-ffmpeg`,
  `ffmpeg-static`, `youtubei.js`, `instagram-url-direct`, `mathjs`.

## New commands

| Command | Description |
|---|---|
| `.sticker` (alias `.s`) | Reply to / send an image → static sticker, or a short (≤10s) video/gif → animated sticker |
| `.toimg` | Reply to a static sticker → converts it back to a PNG |
| `.ytmp3` (alias `.ytaudio`) | `.ytmp3 <YouTube URL>` — downloads audio as MP3 |
| `.ytmp4` (alias `.ytvideo`) | `.ytmp4 <YouTube URL>` — downloads the video as MP4 |
| `.tiktok` (alias `.tt`) | `.tiktok <URL>` — downloads without the watermark |
| `.instagram` (aliases `.ig`, `.igdl`) | `.instagram <post/reel URL>` — public posts/reels only |
| `.translate` (alias `.tr`) | `.translate <lang_code> <text>`, or reply to a message with `.translate <lang_code>` |
| `.weather` (alias `.wthr`) | `.weather <city>` — requires `WEATHER_API_KEY` |
| `.shorturl` (alias `.short`) | `.shorturl <url>` |
| `.qrcode` (alias `.qr`) | `.qrcode <text or url>` — sends back a QR code image |
| `.calc` (aliases `.calculate`, `.math`) | `.calc <expression>` |
| `.base64` (alias `.b64`) | `.base64 encode\|decode <text>` |
| `.tts` | `.tts [lang_code] <text>` — max 200 characters |

All downloader commands (`.ytmp3`, `.ytmp4`, `.tiktok`, `.instagram`)
share the same size guard: anything over `MAX_DOWNLOAD_MB` (default
50MB) is aborted with a clear error instead of silently failing or
hanging. Downloaded files are always written to `media/` and deleted
again once sent, so nothing accumulates on disk over time.

**A note on the downloader commands specifically:** YouTube, TikTok, and
Instagram do not offer official download APIs, so these commands rely on
public/community-maintained methods that can and do break when those
platforms change something on their end. If a downloader stops working,
that's the platform's side changing — not a bug you introduced. Also
worth keeping in mind: only download content you have the right to
download, and respect each platform's Terms of Service.

## Setup

1. (Optional) Get a free OpenWeatherMap key for `.weather`:
   https://openweathermap.org/api → set `WEATHER_API_KEY` in `.env`.
2. Everything else in this phase (stickers, downloaders, translate, QR,
   short URL, calc, base64, tts) works with **no additional API keys**.
3. Install the new dependencies (see below) — this phase bundles its own
   ffmpeg binary via `ffmpeg-static`, so you do **not** need to install
   ffmpeg separately, even on Windows.

## Run it (Windows CMD)

```cmd
cd whatsapp-bot
npm install
npm start
```

`npm install` will pull down the Phase 3 packages (`sharp`,
`node-webpmux`, `fluent-ffmpeg`, `ffmpeg-static`, `youtubei.js`,
`instagram-url-direct`, `mathjs`) alongside everything from Phase 1 and
2. `sharp` and `ffmpeg-static` both ship prebuilt binaries for Windows,
so no extra build tools should be needed — if `npm install` does
complain about build tools, running it again usually resolves it once
npm has cached the prebuilt binary.

Try it out:
```
!sticker          (reply to an image)
!ytmp3 https://youtube.com/watch?v=...
!tiktok https://www.tiktok.com/@user/video/...
!translate es Good morning
!weather Lagos
!qrcode https://example.com
!calc 12 * (7 - 2)
```
