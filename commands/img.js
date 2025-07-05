const axios = require("axios");

module.exports = {
  name: "img",
  run: async (sock, msg, sender, args) => {
    const query = args.trim();
    if (!query) {
      await sock.sendMessage(sender, { text: "❗️ اكتب كلمة بعد الأمر مثل: img بحر" });
      return;
    }

    await sock.sendMessage(sender, { text: `🔍 جاري البحث عن صورة لـ: ${query}` });

    try {
      const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
        headers: {
          Authorization: '9vySYMFQtn9OjUO2jHt7CQ45Uwfw4fWyE3UcLouC4kb1oqc8Da8cNNHy'
        }
      });

      const photo = res.data.photos?.[0];
      if (photo?.src?.original) {
        await sock.sendMessage(sender, {
          image: { url: photo.src.original },
          caption: `📸 نتيجة البحث عن: ${query}`
        });
      } else {
        await sock.sendMessage(sender, { text: "❌ لم يتم العثور على صور." });
      }

    } catch (err) {
      console.error("img error:", err.message);
      await sock.sendMessage(sender, { text: "❌ حدث خطأ أثناء البحث عن الصورة." });
    }
  }
};
