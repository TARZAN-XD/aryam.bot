const TelegramBot = require("node-telegram-bot-api");
const { generatePairingCode } = require("./pairing");
const fs = require("fs-extra");
const path = require("path");

// ✅ التوكن الخاص بالبوت
const TG_TOKEN = "7468967312:AAGeEoeJaD1WarTcLhbRBmbil1kD-Mz3khE";

// ✅ تشغيل البوت
const bot = new TelegramBot(TG_TOKEN, { polling: true });

// ✅ رسالة ترحيب عند البدء
bot.on("message", async (msg) => {
  if (msg.text === "/start" || msg.text === "/help") {
    const welcome = `
🤖 *مرحبًا بك في بوت ربط واتساب عبر تيليجرام!*

📌 *الأوامر المتاحة:*

🔗 *ربط رقم واتساب:*
\`/pair 966xxxxxxxxx\`

🗑️ *حذف جلسة رقم:*
\`/delpair 966xxxxxxxxx\`

📋 *عرض الأرقام المرتبطة:*
\`/listpairs\`

> البوت من تطوير: *طرزان الوقدي*
    `;
    await bot.sendMessage(msg.chat.id, welcome, { parse_mode: "Markdown" });
  }
});

// ✅ أمر /pair <رقم> لتوليد رمز الاقتران
bot.onText(/^\/pair (\d{8,15})$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const number = match[1];

  try {
    await bot.sendMessage(chatId, `🔄 جاري توليد رمز الاقتران للرقم: *${number}* ...`, { parse_mode: "Markdown" });
    const code = await generatePairingCode(number);
    await bot.sendMessage(chatId, `🔑 رمز الاقتران:\n\n*${code}*`, {
      parse_mode: "Markdown"
    });
    await bot.sendMessage(chatId, `❗️ أدخل الرمز في *واتساب > الأجهزة المرتبطة > ربط جهاز*`, {
      parse_mode: "Markdown"
    });
  } catch (err) {
    await bot.sendMessage(chatId, `❌ خطأ أثناء توليد الرمز:\n${err.message}`);
  }
});

// ✅ أمر /delpair <رقم> لحذف الجلسة
bot.onText(/^\/delpair (\d{8,15})$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const number = match[1];
  const sessionPath = path.join(__dirname, "session", number);

  try {
    if (await fs.pathExists(sessionPath)) {
      await fs.remove(sessionPath);
      await bot.sendMessage(chatId, `🗑️ تم حذف جلسة الرقم *${number}* بنجاح.\nاستخدم /pair لإعادة الربط.`, {
        parse_mode: "Markdown"
      });
    } else {
      await bot.sendMessage(chatId, `⚠️ لا توجد جلسة محفوظة لهذا الرقم.`);
    }
  } catch (err) {
    await bot.sendMessage(chatId, `❌ حدث خطأ أثناء حذف الجلسة:\n${err.message}`);
  }
});

// ✅ أمر /listpairs لعرض كل الأرقام المرتبطة
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
