const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const path = require("path");
const P = require("pino");

const commands = new Map();

function loadCommands() {
  const cmdPath = path.join(__dirname, "commands");
  fs.readdirSync(cmdPath).forEach(file => {
    if (file.endsWith(".js")) {
      const command = require(path.join(cmdPath, file));
      commands.set(command.name.toLowerCase(), command.run);
    }
  });
}

loadCommands();

async function startSession(number, chatId, bot) {
  const sessionPath = `./session/${number}`;
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: ['Chrome', 'Chrome', '120']
  });

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      await bot.sendMessage(chatId, `✅ تم تسجيل الدخول للرقم ${number}`);
    }
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode || "غير معروف";
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        await bot.sendMessage(chatId, `⚠️ تم قطع الاتصال، يعاد الاتصال...`);
        setTimeout(() => startSession(number, chatId, bot), 5000);
      } else {
        await bot.sendMessage(chatId, `❌ تم تسجيل الخروج نهائيًا.`);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;

    const [cmdName, ...args] = text.trim().split(" ");
    const cmd = commands.get(cmdName.toLowerCase());
    if (cmd) {
      try {
        await cmd(sock, msg, sender, args.join(" "));
      } catch (e) {
        console.error(e);
        await sock.sendMessage(sender, { text: "❌ حدث خطأ أثناء تنفيذ الأمر." });
      }
    }
  });
}

module.exports = { startSession };
