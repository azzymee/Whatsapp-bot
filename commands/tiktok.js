// commands/tiktok.js
// Downloads a TikTok video without the watermark, via the free public
// tikwm.com API (no key/auth needed).

const fs = require('fs');
const logger = require('../lib/logger');
const { downloadUrlToFile, cleanup } = require('../lib/downloader');

const TIKWM_API = 'https://www.tikwm.com/api/';

module.exports = {
  name: 'tiktok',
  emoji: '🎵',
  aliases: ['tt'],
  category: 'downloader',
  description: 'Downloads a TikTok video without the watermark. Usage: .tiktok <url>',
  usage: '.tiktok <url>',
  async execute({ sock, from, args, prefix }) {
    const url = args[0];
    if (!url || !/tiktok\.com/i.test(url)) {
      await sock.sendMessage(from, { text: `Usage: ${prefix}tiktok <TikTok URL>` });
      return;
    }

    let filePath;
    try {
      const res = await fetch(`${TIKWM_API}?url=${encodeURIComponent(url)}&hd=1`);
      const json = await res.json();

      if (json.code !== 0 || !json.data?.play) {
        throw new Error(json.msg || 'Could not resolve that TikTok link.');
      }

      filePath = await downloadUrlToFile(json.data.play, 'mp4');

      await sock.sendMessage(from, {
        video: fs.readFileSync(filePath),
        caption: json.data.title ? `🎵 ${json.data.title}` : undefined,
      });
    } catch (err) {
      logger.error({ err }, 'tiktok download failed');
      await sock.sendMessage(from, { text: `❌ Couldn't download that TikTok: ${err.message}` });
    } finally {
      if (filePath) cleanup(filePath);
    }
  },
};
