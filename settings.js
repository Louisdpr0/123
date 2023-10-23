const fs = require('fs');
const allowedPrefix = ['.zeni']; // Prefix yang diizinkan untuk merespon

global.fotomenfess = fs.readFileSync("./menfess.jpg");
global.owner = ["6289653898291"];

global.help = {
  Menu(pushname) {
    return `Halo ${pushname}

Saya adalah bot WhatsApp confess 👋 ketik .zeni untuk memulai chat.
    `;
  },
};

