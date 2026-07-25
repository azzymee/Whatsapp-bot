// lib/downloader.js
// Shared helpers for the downloader commands (ytmp3, ytmp4, tiktok,
// instagram): streaming a remote URL or a Web ReadableStream (what
// youtubei.js's download() returns) into a size-capped temp file under
// media/, transcoding audio to a real .mp3, extracting YouTube video
// IDs from URLs, and cleaning up afterwards.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const config = require('../config/config');
const logger = require('./logger');

ffmpeg.setFfmpegPath(ffmpegPath);

const MEDIA_DIR = path.join(__dirname, '..', config.paths.media);
const MAX_BYTES = config.maxDownloadMB * 1024 * 1024;

function tempFilePath(ext) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  return path.join(MEDIA_DIR, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`);
}

/**
 * Pipes any Node Readable into a temp file, aborting once more than
 * MAX_BYTES have come through so a huge/unexpected file can't fill the
 * disk or blow past what WhatsApp will accept.
 */
async function streamToFile(nodeStream, ext) {
  const filePath = tempFilePath(ext);
  let downloaded = 0;

  nodeStream.on('data', (chunk) => {
    downloaded += chunk.length;
    if (downloaded > MAX_BYTES) {
      nodeStream.destroy(
        new Error(`File exceeded the ${config.maxDownloadMB}MB limit while downloading.`)
      );
    }
  });

  await pipeline(nodeStream, fs.createWriteStream(filePath));
  return filePath;
}

/**
 * Downloads a plain HTTP(S) URL (e.g. a TikTok/Instagram CDN link) to a
 * capped temp file. Used by commands that already have a direct media
 * URL rather than a stream to work with.
 */
async function downloadUrlToFile(url, ext) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${response.status}`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength && contentLength > MAX_BYTES) {
    throw new Error(
      `File is too large (${(contentLength / 1024 / 1024).toFixed(1)}MB). Limit is ${config.maxDownloadMB}MB.`
    );
  }

  return streamToFile(Readable.fromWeb(response.body), ext);
}

/**
 * Writes a Web ReadableStream (what youtubei.js's Innertube#download()
 * returns) to a capped temp file.
 */
async function downloadWebStreamToFile(webStream, ext) {
  return streamToFile(Readable.fromWeb(webStream), ext);
}

/**
 * Transcodes any audio/video file into a real 128kbps .mp3 using the
 * bundled ffmpeg binary (via ffmpeg-static, no manual ffmpeg install
 * needed), so whatever gets sent to WhatsApp genuinely matches the
 * audio/mpeg mimetype it's labeled with.
 */
function transcodeToMp3(inputPath) {
  const outputPath = tempFilePath('mp3');
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioBitrate(128)
      .toFormat('mp3')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

/**
 * Pulls the 11-character video ID out of any common YouTube URL shape
 * (watch?v=, youtu.be/, /shorts/, /embed/). Returns null if none found.
 */
function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function cleanup(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      logger.error({ err }, `Failed to clean up temp file ${filePath}`);
    }
  });
}

module.exports = {
  downloadUrlToFile,
  downloadWebStreamToFile,
  transcodeToMp3,
  extractYouTubeId,
  cleanup,
  MEDIA_DIR,
};
