// commands/ytmp3.js
// Downloads a YouTube video's audio track and sends it as an MP3.
// Uses youtubei.js (InnerTube), the actively-maintained client that
// replaced the now-deprecated ytdl-core family, then transcodes with
// ffmpeg so the file genuinely is an mp3 rather than a renamed stream.

const { Innertube } = require('youtubei.js');
const fs = require('fs');
const logger = require('../lib/logger');
const {
  extractYouTubeId,
  downloadWebStreamToFile,
  transcodeToMp3,
  cleanup,
} = require('../lib/downloader');

// Innertube.create() does a bit of setup work, so only do it once and
// reuse the same instance across calls.
let innertubePromise;
function getInnertube() {
  if (!innertubePromise) innertubePromise = Innertube.create();
  return innertubePromise;
}

module.exports = {
  name: 'ytmp3',
  emoji: '🎧',
  aliases: ['ytaudio'],
  category: 'downloader',
  description: 'Downloads a YouTube video as an MP3. Usage: .ytmp3 <url>',
  usage: '.ytmp3 <url>',
  async execute({ sock, from, args, prefix }) {
    const videoId = extractYouTubeId(args[0]);
    if (!videoId) {
      await sock.sendMessage(from, { text: `Usage: ${prefix}ytmp3 <YouTube URL>` });
      return;
    }

    let rawPath;
    let mp3Path;
    try {
      const yt = await getInnertube();
      const info = await yt.getBasicInfo(videoId);
      const title = (info.basic_info?.title || 'audio').replace(/[\\/:*?"<>|]/g, '');

      await sock.sendMessage(from, { text: `⬇️ Downloading *${title}*...` });

      const stream = await yt.download(videoId, {
        type: 'audio',
        quality: 'best',
        format: 'any',
      });
      rawPath = await downloadWebStreamToFile(stream, 'audio.tmp');
      mp3Path = await transcodeToMp3(rawPath);

      await sock.sendMessage(from, {
        audio: fs.readFileSync(mp3Path),
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
      });
    } catch (err) {
      logger.error({ err }, 'ytmp3 failed');
      await sock.sendMessage(from, {
        text:
          `❌ Couldn't download that video's audio. YouTube changes things often, ` +
          `which can break downloaders like this — try again later or with a ` +
          `different link.\n(${err.message})`,
      });
    } finally {
      if (rawPath) cleanup(rawPath);
      if (mp3Path) cleanup(mp3Path);
    }
  },
};
