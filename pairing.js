// pairing.js
const { makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const fs = require("fs-extra");
const path = require("path");
const qrcode = require("qrcode");

async function generateQRCode(number) {
  const sessionDir = path.join(__dirname, "session", number);
  await fs.ensureDir(sessionDir);
  const { state, saveState } = useSingleFileAuthState(path.join(sessionDir, "auth_info.json"));

  return new Promise((resolve, reject) => {
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr } = update;

      if (qr) {
        const qrImagePath = path.join(sessionDir, "qr.png");
        await qrcode.toFile(qrImagePath, qr);
        resolve(qrImagePath);
      }

      if (connection === "open") {
        await sock.logout();
      }

      if (connection === "close") {
        const shouldReconnect = (update.lastDisconnect?.error instanceof Boom) &&
          update.lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
        if (!shouldReconnect) {
          reject(new Error("تم إغلاق الاتصال"));
        }
      }
    });

    sock.ev.on("creds.update", saveState);
  });
}

module.exports = {
  generateQRCode,
};
