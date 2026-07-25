// commands/instagram.js
// Downloads public Instagram posts/reels (photo or video, including
// multi-item carousels) via the instagram-url-direct package. Private
// accounts and stories are not supported — Instagram doesn't expose
// those without a logged-in session.

const fs = require('fs');
const { instagramGetUrl } = require('instagram-url-direct');
const logger = require('../lib/logger');
const { downloadUrlToFile, cleanup } = require('../lib/downloader');

const MAX_ITEMS = 5; // cap carousel posts so one command can't flood a chat

module.exports = {
  name: 'instagram',
  emoji: '📸',
  aliases: ['ig', 'igdl'],
  category: 'downloader',
  description: 'Downloads a public Instagram post or reel. Usage: .instagram <url>',
  usage: '.instagram <url>',
  async execute({ sock, from, args, prefix }) {
    const url = args[0];
    if (!url || !/instagram\.com/i.test(url)) {
      await sock.sendMessage(from, { text: `Usage: ${prefix}instagram <Instagram post/reel URL>` });
      return;
    }

    const filePaths = [];
    try {
      const result = await instagramGetUrl(url);
      const items =
        result?.media_details?.length
          ? result.media_details
          : (result?.url_list || []).map((u) => ({
              type: /\.mp4(\?|$)/i.test(u) ? 'video' : 'image',
              url: u,
            }));

      if (!items.length) {
        throw new Error('No downloadable media found at that link (it may be private).');
      }

      for (const item of items.slice(0, MAX_ITEMS)) {
        const isVideo = item.type === 'video';
        const filePath = await downloadUrlToFile(item.url, isVideo ? 'mp4' : 'jpg');
        filePaths.push(filePath);

        if (isVideo) {
          await sock.sendMessage(from, { video: fs.readFileSync(filePath) });
        } else {
          await sock.sendMessage(from, { image: fs.readFileSync(filePath) });
        }
      }
    } catch (err) {
      logger.error({ err }, 'instagram download failed');
      await sock.sendMessage(from, {
        text: `❌ Couldn't download that: ${err.message}\nInstagram changes its site often, which can break this — try again later.`,
      });
    } finally {
      filePaths.forEach(cleanup);
    }
  },
};
