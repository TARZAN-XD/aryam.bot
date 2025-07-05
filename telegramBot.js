// telegramBot.js
const TelegramBot = require("node-telegram-bot-api");
const { generateQRCode } = require("./pairing");
const fs = require("fs-extra");
const path = require("path");

// ✅ التوكن الخاص بالبوت
const TG_TOKEN = "7277157537:AAFNn75vKddw_zuZo1ljJ0r5SASyuheJRCs";

// ✅ تشغيل البوت
const bot = new TelegramBot(TG_TOKEN, { polling: true });

// ✅ رسالة ترحيب عند البدء
bot.on("message", async (msg) => {
  if (msg.text === "/start" || msg.text === "/help") {
    const welcome = `
🤖 *مرحبًا بك في بوت ربط واتساب عبر تيليجرام!*

📌 *الأوامر المتاحة:*

📷 *توليد كود QR للربط:*
\`/qr 966xxxxxxxxx\`

🗑️ *حذف جلسة رقم:*
\`/delpair 966xxxxxxxxx\`

📋 *عرض الأرقام المرتبطة:*
\`/listpairs\`

> البوت من تطوير: *طرزان الوقدي*
    `;
    await bot.sendMessage(msg.chat.id, welcome, { parse_mode: "Markdown" });
  }
});

// ✅ توليد كود QR حقيقي
bot.onText(/^\/qr (\d{8,15})$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const number = match[1];

  try {
    await bot.sendMessage(chatId, `🔄 جاري توليد كود QR للرقم: *${number}* ...`, { parse_mode: "Markdown" });
    await generateQRCode(number, chatId, bot);
  } catch (err) {
    await bot.sendMessage(chatId, `❌ خطأ أثناء توليد الكود:\n${err.message}`);
  }
});

// ✅ حذف الجلسة
bot.onText(/^\/delpair (\d{8,15})$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const number = match[1];
  const sessionPath = path.join(__dirname, "session", number);

  try {
    if (await fs.pathExists(sessionPath)) {
      await fs.remove(sessionPath);
      await bot.sendMessage(chatId, `🗑️ تم حذف جلسة الرقم *${number}* بنجاح.`, {
        parse_mode: "Markdown"
      });
    } else {
      await bot.sendMessage(chatId, `⚠️ لا توجد جلسة محفوظة لهذا الرقم.`);
    }
  } catch (err) {
    await bot.sendMessage(chatId, `❌ خطأ أثناء حذف الجلسة:\n${err.message}`);
  }
});

// ✅ عرض الجلسات
bot.onText(/^\/listpairs$/, async (msg) => {
  const chatId = msg.chat.id;
  const sessionDir = path.join(__dirname, "session");

  try {
    if (!(await fs.pathExists(sessionDir))) {
      return await bot.sendMessage(chatId, "📂 لا توجد أي جلسات حالية.");
    }

    const folders = await fs.readdir(sessionDir);
    const active = folders.filter(name => /^\d+$/.test(name));

    if (active.length === 0) {
      return await bot.sendMessage(chatId, "📂 لا توجد أي جلسات حالية.");
    }

    const list = active.map((n, i) => `🔸 ${i + 1}. +${n}`).join("\n");
    await bot.sendMessage(chatId, `
📄 *قائمة الأرقام المرتبطة:*

${list}

📌 *المجموع:* ${active.length} رقم
    `, { parse_mode: "Markdown" });

  } catch (err) {
    await bot.sendMessage(chatId, `❌ خطأ أثناء عرض الجلسات:\n${err.message}`);
  }
});
