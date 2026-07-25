// commands/qrcode.js
// Generates a QR code image via the free, keyless qrserver.com API.

module.exports = {
  name: 'qrcode',
  emoji: '📱',
  aliases: ['qr'],
  category: 'utility',
  description: 'Generates a QR code. Usage: .qrcode <text or url>',
  usage: '.qrcode <text or url>',
  async execute({ sock, from, text, prefix }) {
    if (!text) {
      await sock.sendMessage(from, { text: `Usage: ${prefix}qrcode <text or url>` });
      return;
    }

    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
        text
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`QR service returned HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      await sock.sendMessage(from, { image: buffer, caption: `📱 QR code for: ${text}` });
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ ${err.message}` });
    }
  },
};
