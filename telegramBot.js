const TelegramBot = require("node-telegram-bot-api");
const { generatePairingCode } = require("./pairing");

// **مضمّن التوكن هنا مباشرة**
const TG_TOKEN = "7277157537:AAFNn75vKddw_zuZo1ljJ0r5SASyuheJRCs";

const bot = new TelegramBot(TG_TOKEN, { polling: true });

bot.onText(/^\/pair (\d{8,15})$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const number = match[1];

  try {
    await bot.sendMessage(chatId, `🔄 جاري توليد رمز الاقتران للرقم: ${number}`);

    const code = await generatePairingCode(number);
    await bot.sendMessage(chatId, `🔑 رمز الاقتران الخاص بك:\n\n*${code}*`, {
      parse_mode: "Markdown"
    });

    await bot.sendMessage(chatId, `❗️ أدخل الرمز في واتساب > الأجهزة المرتبطة > ربط جهاز`);
  } catch (err) {
    await bot.sendMessage(chatId, `❌ خطأ أثناء توليد الرمز:\n${err.message}`);
  }
});
