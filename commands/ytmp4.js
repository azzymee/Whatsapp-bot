// commands/ytmp4.js
// Downloads a YouTube video (video + audio, mp4 container) and sends
// it as a video message. Uses youtubei.js, same as ytmp3.js.

const { Innertube } = require('youtubei.js');
const fs = require('fs');
const logger = require('../lib/logger');
const { extractYouTubeId, downloadWebStreamToFile, cleanup } = require('../lib/downloader');

let innertubePromise;
function getInnertube() {
  if (!innertubePromise) innertubePromise = Innertube.create();
  return innertubePromise;
}

module.exports = {
  name: 'ytmp4',
  emoji: '🎬',
  aliases: ['ytvideo'],
  category: 'downloader',
  description: 'Downloads a YouTube video as an MP4. Usage: .ytmp4 <url>',
  usage: '.ytmp4 <url>',
  async execute({ sock, from, args, prefix }) {
    const videoId = extractYouTubeId(args[0]);
    if (!videoId) {
      await sock.sendMessage(from, { text: `Usage: ${prefix}ytmp4 <YouTube URL>` });
      return;
    }

    let filePath;
    try {
      const yt = await getInnertube();
      const info = await yt.getBasicInfo(videoId);
      const title = (info.basic_info?.title || 'video').replace(/[\\/:*?"<>|]/g, '');

      await sock.sendMessage(from, { text: `⬇️ Downloading *${title}*...` });

      // "bestefficiency" favors a smaller file over max resolution,
      // which matters a lot given MAX_DOWNLOAD_MB and WhatsApp's own
      // media-size limits.
      const stream = await yt.download(videoId, {
        type: 'videoandaudio',
        quality: 'bestefficiency',
        format: 'mp4',
      });
      filePath = await downloadWebStreamToFile(stream, 'mp4');

      await sock.sendMessage(from, {
        video: fs.readFileSync(filePath),
        caption: title,
        mimetype: 'video/mp4',
      });
    } catch (err) {
      logger.error({ err }, 'ytmp4 failed');
      await sock.sendMessage(from, {
        text:
          `❌ Couldn't download that video. YouTube changes things often, which ` +
          `can break downloaders like this — try again later or with a different ` +
          `link.\n(${err.message})`,
      });
    } finally {
      if (filePath) cleanup(filePath);
    }
  },
};
