// telegramBot.js
const TelegramBot = require("node-telegram-bot-api");
const { generatePairingCode, generateQRCode, deleteSession } = require("./whatsappManager");
const fs = require("fs-extra");
const path = require("path");
const express = require("express");
const cors = require("cors");

const TG_TOKEN = "7277157537:AAFNn75vKddw_zuZo1ljJ0r5SASyuheJRCs"; // توكن البوت
const SESSION_DIR = path.join(__dirname, "session");
const bot = new TelegramBot(TG_TOKEN, { polling: true });
const app = express();

app.use(cors());
app.use(express.json());

// دالة التحقق من الرقم
function isValidNumber(number) {
  return /^[0-9]{8,15}$/.test(number);
}

bot.on("message", async (msg) => {
  const text = msg.text?.trim();
  const chatId = msg.chat.id;
  if (!text) return;

  if (text === "/start" || text === "/help") {
    return bot.sendMessage(chatId, `
🤖 *بوت ربط واتساب عبر تيليجرام*

📌 *الأوامر المتاحة:*

🔗 ربط برمز اقتران:
/pair <رقم الهاتف>

📷 ربط بكود QR:
/qr <رقم الهاتف>

🗑 حذف جلسة:
/delpair <رقم الهاتف>

📋 عرض الأرقام المرتبطة:
/listpairs

> المطور: طرزان الوقدي 💀
    `, { parse_mode: "Markdown" });
  }

  // أمر /pair
  if (text.startsWith("/pair ")) {
    const number = text.split(" ")[1];
    if (!isValidNumber(number)) {
      return bot.sendMessage(chatId, "❌ رقم غير صالح. استخدم: /pair 9665XXXXXXX");
    }

    try {
      bot.sendMessage(chatId, `🔄 جاري توليد رمز اقتران للرقم: *${number}* ...`, { parse_mode: "Markdown" });
      const code = await generatePairingCode(number);
      return bot.sendMessage(chatId, `🔑 رمز الاقتران الخاص بالرقم *${number}*:

*${code}*

📲 من واتساب: الأجهزة المرتبطة > ربط جهاز > (رمز بدون QR)`, { parse_mode: "Markdown" });
    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, `❌ فشل توليد رمز الاقتران: ${err.message}`);
    }
  }

  // أمر /qr
  if (text.startsWith("/qr ")) {
    const number = text.split(" ")[1];
    if (!isValidNumber(number)) {
      return bot.sendMessage(chatId, "❌ رقم غير صالح. استخدم: /qr 9665XXXXXXX");
    }

    try {
      await generateQRCode(number, chatId, bot);
    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, `❌ فشل توليد كود QR: ${err.message}`);
    }
  }

  // أمر /delpair
  if (text.startsWith("/delpair ")) {
    const number = text.split(" ")[1];
    if (!isValidNumber(number)) {
      return bot.sendMessage(chatId, "❌ رقم غير صالح. استخدم: /delpair 9665XXXXXXX");
    }

    try {
      const result = await deleteSession(number);
      return bot.sendMessage(chatId, result);
    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, `❌ خطأ أثناء حذف الجلسة: ${err.message}`);
    }
  }

  // أمر /listpairs
  if (text === "/listpairs") {
    try {
      const numbers = (await fs.readdir(SESSION_DIR)).filter(d => /^\d+$/.test(d));
      if (!numbers.length) return bot.sendMessage(chatId, "📂 لا توجد جلسات حالية.");

      const list = numbers.map((n, i) => `🔹 ${i + 1}. +${n}`).join("\n");
      return bot.sendMessage(chatId, `📋 *الجلسات الحالية:*\n\n${list}`, { parse_mode: "Markdown" });
    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, `❌ فشل عرض الجلسات: ${err.message}`);
    }
  }
});

// API Web: توليد رمز اقتران من الواجهة الأمامية
app.post("/api/pair", async (req, res) => {
  const number = req.body.number;
  if (!isValidNumber(number)) {
    return res.status(400).json({ error: "رقم غير صالح" });
  }

  try {
    const code = await generatePairingCode(number);
    res.json({ code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("✅ Telegram & WhatsApp Bot + API يعمل على المنفذ 3000"));
