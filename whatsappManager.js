// whatsappManager.js
const fs = require("fs-extra");
const path = require("path");

// مجلد الجلسات
const sessionsDir = path.join(__dirname, "session");

// توليد رمز اقتران وهمي (لأغراض تجريبية)
async function generatePairingCode(number) {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const sessionPath = path.join(sessionsDir, number);
  await fs.ensureDir(sessionPath);
  await fs.writeFile(path.join(sessionPath, "pairingCode.txt"), code);
  return code;
}

// توليد QR وهمي (فقط كمثال)
async function generateQRCode(number, chatId, bot) {
  const fakeQRCode = `https://api.qrserver.com/v1/create-qr-code/?data=${number}&size=300x300`;
  await bot.sendPhoto(chatId, fakeQRCode, {
    caption: `🟩 كود QR للرقم: +${number}`
  });
}

// حذف الجلسة
async function deleteSession(number) {
  const sessionPath = path.join(sessionsDir, number);
  if (await fs.pathExists(sessionPath)) {
    await fs.remove(sessionPath);
    return `🗑️ تم حذف جلسة الرقم (${number}) بنجاح.`;
  } else {
    return `⚠️ لا توجد جلسة لهذا الرقم (${number}).`;
  }
}

module.exports = {
  generatePairingCode,
  generateQRCode,
  deleteSession
};
