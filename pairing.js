const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore, DisconnectReason } = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const path = require("path");

const sessionsDir = path.join(__dirname, "session");
fs.ensureDirSync(sessionsDir);

const sockets = {};

async function generatePairingCode(number) {
  const sessionPath = path.join(sessionsDir, number);
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  return new Promise((resolve, reject) => {
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      defaultQueryTimeoutMs: 60000,
      syncFullHistory: false,
    });

    sockets[number] = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, pairingCode, lastDisconnect } = update;

      if (connection === "close") {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (!shouldReconnect) {
          reject(new Error("تم تسجيل الخروج أو فشل الاتصال."));
        }
      }

      if (pairingCode) {
        resolve(pairingCode);
      }
    });

    sock.ev.on("messages.upsert", () => {});
  });
}

module.exports = {
  generatePairingCode
};
