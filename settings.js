const fs = require('fs');
const allowedPrefix = ['.zeni']; // Prefix yang diizinkan untuk merespon

global.fotomenfess = fs.readFileSync("./menfess.jpg");
global.owner = ["62887435047326"];

global.help = {
  Menu(pushname) {
    return `Halo ${pushname}

Saya adalah bot WhatsApp confess 👋 ketik .zeni untuk memulai chat.
    `;
  },
};

// Fungsi untuk menangani pesan yang diterima
function handleMessage(client, message) {
  const { from, body } = message;
  const isAllowedPrefix = allowedPrefix.some(prefix => body.startsWith(prefix));

  if (isAllowedPrefix) {
    // Lakukan sesuatu dengan pesan yang memiliki prefix yang diizinkan
    // Contoh: balas pesan, lakukan operasi, dll.
  }
}

// Event listener untuk pesan yang masuk
client.on('message', message => {
  handleMessage(client, message);
});
