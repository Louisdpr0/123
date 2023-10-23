const fs = require('fs');
const { Client } = require('whatsapp-web.js');

const client = new Client();

client.on('message', async (message) => {
  if (message.body.startsWith('.start')) {
    // Tanggapi hanya pesan yang dimulai dengan prefix '.confess'
    const response = generateResponse(message.sender.pushname);
    await message.reply(response);
  }
});

function generateResponse(pushname) {
  return `Halo ${pushname}

Saya adalah bot WhatsApp confess 👋 ketik .confess untuk memulai chat.
  `;
}

client.initialize();
