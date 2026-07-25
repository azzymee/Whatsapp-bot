// commands/toimg.js
// Converts a replied-to static sticker back into a regular PNG image.
// Animated stickers are rejected since there's no single frame to
// export as a still image.

const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const logger = require('../lib/logger');
const { getQuotedOrDirectMessage } = require('../utils/helpers');

module.exports = {
  name: 'toimg',
  emoji: '🔄',
  category: 'sticker',
  description: 'Converts a replied static sticker back into an image.',
  usage: '.toimg (reply to a static sticker)',
  async execute({ sock, msg, from, prefix }) {
    const target = getQuotedOrDirectMessage(msg, ['stickerMessage']);
    if (!target) {
      await sock.sendMessage(from, { text: `Reply to a sticker with ${prefix}toimg.` });
      return;
    }

    if (target.message.stickerMessage?.isAnimated) {
      await sock.sendMessage(from, {
        text: "❌ Animated stickers can't be converted to a still image.",
      });
      return;
    }

    try {
      const buffer = await downloadMediaMessage(
        target,
        'buffer',
        {},
        { logger, reuploadRequest: sock.updateMediaMessage }
      );
      const png = await sharp(buffer).png().toBuffer();
      await sock.sendMessage(from, { image: png }, { quoted: msg });
    } catch (err) {
      logger.error({ err }, 'Failed to convert sticker to image');
      await sock.sendMessage(from, { text: `❌ Failed: ${err.message}` });
    }
  },
};
