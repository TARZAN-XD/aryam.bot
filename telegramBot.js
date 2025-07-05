const TelegramBot = require("node-telegram-bot-api");
const { generateQRCode } = require("./pairing");
const fs = require("fs-extra");
const path = require("path");

const TG_TOKEN = "7277157537:AAFNn75vKddw_zuZo1ljJ0r5SASyuheJRCs";
const bot = new TelegramBot(TG_TOKEN, { polling: true });

bot.onText(/^\/start|\/help$/, async (msg) => {
  const help = `
🤖 *مرحبًا بك في بوت ربط واتساب عبر QR!*

📌 *الأوامر:*
📷 \`/qr 966xxxxxxxxx\` - توليد QR للرقم
🗑 \`/delpair 966xxxxxxxxx\` - حذف الجلسة
📋 \`/listpairs\` - قائمة الجلسات
`;
  await bot.sendMessage(msg.chat.id, help, { parse_mode: "Markdown" });
});

bot.onText(/^\/qr (\d{8,15})$/, async (msg, match) => {
  const number = match[1];
  const chatId = msg.chat.id;

  try {
    await bot.sendMessage(chatId, `📸 جاري توليد QR للرقم: *${number}*`, { parse_mode: "Markdown" });
    const qrImageBuffer = await generateQRCode(number);
    await bot.sendPhoto(chatId, qrImageBuffer, { caption: `✅ امسح الكود داخل واتساب - ${number}` });
  } catch (err) {
    await bot.sendMessage(chatId, `❌ خطأ أثناء توليد الكود:\n${err.message}`);
  }
});

bot.onText(/^\/delpair (\d{8,15})$/, async (msg, match) => {
  const number = match[1];
  const sessionPath = path.join(__dirname, "session", number);
  const chatId = msg.chat.id;

  try {
    if (await fs.pathExists(sessionPath)) {
      await fs.remove(sessionPath);
      await bot.sendMessage(chatId, `🗑 تم حذف جلسة الرقم: *${number}*`, { parse_mode: "Markdown" });
    } else {
      await bot.sendMessage(chatId, `⚠️ لا توجد جلسة لهذا الرقم.`);
    }
  } catch (err) {
    await bot.sendMessage(chatId, `❌ خطأ:\n${err.message}`);
  }
});

bot.onText(/^\/listpairs$/, async (msg) => {
  const sessionDir = path.join(__dirname, "session");
  const chatId = msg.chat.id;

  try {
    const all = (await fs.readdir(sessionDir)).filter((n) => /^\d+$/.test(n));
    if (!all.length) {
      return await bot.sendMessage(chatId, `📂 لا توجد جلسات حالياً.`);
    }

    const list = all.map((n, i) => `🔹 ${i + 1}. +${n}`).join("\n");
    await bot.sendMessage(chatId, `📋 *الجلسات:*\n${list}`, { parse_mode: "Markdown" });
  } catch (err) {
    await bot.sendMessage(chatId, `❌ فشل عرض الجلسات:\n${err.message}`);
  }
});
