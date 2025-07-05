const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const P = require("pino");

async function generatePairingCode(number) {
  const sessionPath = `./session/${number}`;
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ['Chrome', 'Chrome', '120']
  });

  sock.ev.on("creds.update", saveCreds);

  const code = await sock.requestPairingCode(number);
  return code;
}

module.exports = { generatePairingCode };
