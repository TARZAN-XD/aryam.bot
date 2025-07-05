// pairing.js
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const path = require("path");
const qrcode = require("qrcode");

const sessionsDir = path.join(__dirname, "session");

async function generateQRCode(number, chatId, bot) {
  const sessionPath = path.join(sessionsDir, number);
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("connection.update", async (update) => {
    const { qr, connection } = update;

    if (qr) {
      const qrImageBuffer = await qrcode.toBuffer(qr);
      await bot.sendPhoto(chatId, qrImageBuffer, {
        caption: `🔗 *امسح هذا الكود بكاميرا واتساب للربط*\n\n📲 الأجهزة المرتبطة > ربط جهاز`,
        parse_mode: "Markdown"
      });
    }

    if (connection === "open") {
      console.log(`✅ تم الربط مع ${number}`);
      await bot.sendMessage(chatId, `✅ تم الربط مع الرقم *${number}* بنجاح!`, {
        parse_mode: "Markdown"
      });
      await sock.logout(); // optional to close after successful login
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

module.exports = {
  generateQRCode
};
