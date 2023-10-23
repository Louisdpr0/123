const allowedPrefix = ['.confess']; // Prefix yang diizinkan untuk merespon

global.fotomenfess = fs.readFileSync("./menfess.jpg")
global.owner = ["62887435047326"]

global.help = {
Menu(pushname){
  return `Halo ${pushname}

Saya adalah bot WhatsApp confess 👋 ketik .confess untuk memulai chat.
`
}
}
