const axios = require("axios");

module.exports = {
  name: "video",
  run: async (sock, msg, sender, args) => {
    const query = args.trim();
    if (!query) {
      await sock.sendMessage(sender, { text: "❗️ اكتب كلمة بعد الأمر مثل: video قطط مضحكة" });
      return;
    }

    await sock.sendMessage(sender, { text: `🔍 جاري البحث عن فيديو لـ: ${query}` });

    try {
      const ytSearch = await axios.get(`https://ytapi.p.rapidapi.com/search?query=${encodeURIComponent(query)}`, {
        headers: {
          "X-RapidAPI-Key": "8f770b32eamsh77f6cde7cef6374p15c016jsnf9edab9e6aed",
          "X-RapidAPI-Host": "ytapi.p.rapidapi.com"
        }
      });

      const result = ytSearch.data.results?.[0];
      if (!result || !result.url) {
        await sock.sendMessage(sender, { text: "❌ لم يتم العثور على نتائج." });
        return;
      }

      const videoUrl = encodeURIComponent(result.url);
      let data;

      try {
        const res1 = await axios.get(`https://apis-keith.vercel.app/download/dlmp4?url=${videoUrl}`);
        data = res1.data;
        if (!data?.status || !data?.result?.downloadUrl) throw new Error("API 1 فشل");
      } catch {
        const res2 = await axios.get(`https://apis.davidcyriltech.my.id/download/ytmp4?url=${videoUrl}`);
        data = res2.data;
        if (!data?.success || !data?.result?.download_url) throw new Error("كلا الـ API فشلا");
      }

      const downloadUrl = data.result.downloadUrl || data.result.download_url;

      await sock.sendMessage(sender, {
        image: { url: result.thumbnail },
        caption: `🎬 *تم العثور على الفيديو:*\n\n📌 *العنوان:* ${result.title}\n⏱️ *المدة:* ${result.timestamp || "غير محددة"}\n🔗 *الرابط:* ${result.url}`
      });

      await sock.sendMessage(sender, {
        video: { url: downloadUrl },
        mimetype: "video/mp4",
        caption: "✅ *تم تحميل الفيديو بنجاح!*"
      });

    } catch (err) {
      console.error("video error:", err.message);
      await sock.sendMessage(sender, { text: `❌ حدث خطأ أثناء تحميل الفيديو:\n${err.message}` });
    }
  }
};
