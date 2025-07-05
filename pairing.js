const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeInMemoryStore,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const path = require("path");
const qrcode = require("qrcode");

const sessionsDir = path.join(__dirname, "session");
fs.ensureDirSync(sessionsDir);

async function generateQRCode(number) {
  const sessionPath = path.join(sessionsDir, number);
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  return new Promise((resolve, reject) => {
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      defaultQueryTimeoutMs: 60000,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
          return reject(new Error("❌ تم قطع الاتصال."));
        }
      }

      if (qr) {
        try {
          const qrImageBuffer = await qrcode.toBuffer(qr);
          resolve(qrImageBuffer);
        } catch (err) {
          reject(new Error("❌ فشل تحويل QR إلى صورة."));
        }
      }

      if (connection === "open") {
        sock.ws.close(); // بعد الربط يغلق
      }
    });
  });
}

module.exports = {
  generateQRCode,
};
