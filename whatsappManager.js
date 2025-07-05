// whatsappManager.js const fs = require("fs-extra"); const path = require("path"); const P = require("pino"); const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys"); const qrcode = require("qrcode");

const sessionsDir = path.join(__dirname, "session"); fs.ensureDirSync(sessionsDir);

async function generatePairingCode(number) { const sessionPath = path.join(sessionsDir, number); await fs.ensureDir(sessionPath);

const { state, saveCreds } = await useMultiFileAuthState(sessionPath); const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({ version, auth: state, printQRInTerminal: false, logger: P({ level: "silent" }), browser: ["Ubuntu", "Chrome", "20.0"] });

sock.ev.on("creds.update", saveCreds); const code = await sock.requestPairingCode(number); return code; }

async function generateQRCode(number, chatId, bot) { const sessionPath = path.join(sessionsDir, number); await fs.ensureDir(sessionPath);

const { state, saveCreds } = await useMultiFileAuthState(sessionPath); const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({ version, auth: state, printQRInTerminal: false, logger: P({ level: "silent" }), browser: ["Ubuntu", "Chrome", "20.0"] });

sock.ev.on("creds.update", saveCreds);

return new Promise((resolve, reject) => { sock.ev.once("connection.update", async (update) => { const { qr, connection } = update;

if (qr) {
    const qrPath = `./qr-${number}.png`;
    await qrcode.toFile(qrPath, qr);
    await bot.sendPhoto(chatId, qrPath, {
      caption: `🔳 امسح هذا الكود لتفعيل الرقم: ${number}`
    });
    setTimeout(() => fs.unlink(qrPath), 15000);
    resolve();
  }

  if (connection === "open") {
    await bot.sendMessage(chatId, `✅ تم ربط الرقم (${number}) بنجاح.`);
    resolve();
  }

  if (connection === "close") {
    reject(new Error("❌ تم إغلاق الاتصال أو لم يتم الربط."));
  }
});

}); }

async function deleteSession(number) { const sessionPath = path.join(sessionsDir, number); if (await fs.pathExists(sessionPath)) { await fs.remove(sessionPath); return 🗑️ تم حذف جلسة الرقم (${number}) بنجاح.; } else { return ⚠️ لا توجد جلسة لهذا الرقم (${number}).; } }

module.exports = { generatePairingCode, generateQRCode, deleteSession };

