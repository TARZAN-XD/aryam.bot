module.exports = {
  name: "ping",
  run: async (sock, msg, sender, args) => {
    await sock.sendMessage(sender, { text: "pong ✅" });
  }
};
