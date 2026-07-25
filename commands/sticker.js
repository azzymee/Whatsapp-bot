// commands/sticker.js
// Converts a replied-to or directly-sent image into a static sticker,
// or a short video/gif into an animated one. Adds pack name/author EXIF
// metadata so WhatsApp shows them under the sticker.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const webpmux = require('node-webpmux');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config/config');
const logger = require('../lib/logger');
const { getQuotedOrDirectMessage } = require('../utils/helpers');

ffmpeg.setFfmpegPath(ffmpegPath);

const ALLOWED_TYPES = ['imageMessage', 'videoMessage'];
const MAX_VIDEO_SECONDS = 10;

function tempPath(ext) {
  const dir = path.join(__dirname, '..', config.paths.media);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`);
}

function videoToAnimatedWebp(inputPath) {
  const outputPath = tempPath('webp');
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .duration(MAX_VIDEO_SECONDS)
      .outputOptions([
        '-vcodec', 'libwebp',
        '-vf',
        'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
        '-loop', '0',
        '-an',
        '-vsync', '0',
      ])
      .toFormat('webp')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}

/**
 * Injects sticker-pack-name / sticker-pack-publisher EXIF metadata into
 * a webp buffer, which is what makes WhatsApp display a pack name and
 * author under the sticker.
 */
async function addExif(webpBuffer) {
  const img = new webpmux.Image();
  await img.load(webpBuffer);

  const json = {
    'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
    'sticker-pack-name': config.stickerPackName,
    'sticker-pack-publisher': config.stickerAuthor,
    emojis: ['🤖'],
  };

  const exifHeader = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
  const exif = Buffer.concat([exifHeader, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);

  img.exif = exif;
  return img.save(null);
}

module.exports = {
  name: 'sticker',
  emoji: '🖼️',
  aliases: ['s', 'stiker'],
  category: 'sticker',
  description: 'Converts a replied/attached image or short video into a sticker.',
  usage: '.sticker (reply to image/video, or attach with caption)',
  async execute({ sock, msg, from, prefix }) {
    const target = getQuotedOrDirectMessage(msg, ALLOWED_TYPES);
    if (!target) {
      await sock.sendMessage(from, {
        text: `Reply to an image/video with ${prefix}sticker, or send one with ${prefix}sticker as the caption.`,
      });
      return;
    }

    let tempInput;
    let tempOutput;
    try {
      const buffer = await downloadMediaMessage(
        target,
        'buffer',
        {},
        { logger, reuploadRequest: sock.updateMediaMessage }
      );
      const isVideo = Boolean(target.message.videoMessage);

      let webpBuffer;
      if (!isVideo) {
        webpBuffer = await sharp(buffer)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp()
          .toBuffer();
      } else {
        tempInput = tempPath('mp4');
        fs.writeFileSync(tempInput, buffer);
        tempOutput = await videoToAnimatedWebp(tempInput);
        webpBuffer = fs.readFileSync(tempOutput);
      }

      const finalBuffer = await addExif(webpBuffer);
      await sock.sendMessage(from, { sticker: finalBuffer }, { quoted: msg });
    } catch (err) {
      logger.error({ err }, 'Failed to create sticker');
      await sock.sendMessage(from, { text: `❌ Failed to create sticker: ${err.message}` });
    } finally {
      if (tempInput) fs.unlink(tempInput, () => {});
      if (tempOutput) fs.unlink(tempOutput, () => {});
    }
  },
};
