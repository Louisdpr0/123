require('./settings')
const { default: WADefault, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require("@adiwajshing/baileys")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const PhoneNumber = require('awesome-phonenumber')
const { smsg } = require('./lib/simple')
const {
   toBuffer,
   toDataURL
} = require('qrcode')
const express = require('express')
let app = express()
let _qr = 'invalid'
let PORT = process.env.PORT
const path = require('path')

let menfess = JSON.parse(fs.readFileSync('./database/confess.json'));

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

async function Botstarted() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)

    const alpha = WADefault({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['BOT CONFESS','Safari','1.0.0'],
        patchMessageBeforeSending: (message) => {

                const requiresPatch = !!(
                  message.buttonsMessage
                  || message.templateMessage
                    || message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
    },
        auth: state
    })

    store.bind(alpha.ev)

    alpha.ev.on('messages.upsert', async chatUpdate => {
        try {
            mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return
            if (!alpha.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            m = smsg(alpha, mek, store)
            if (mek.message.conversation.startsWith('.confess')) {
			require("./confess")(alpha, m, chatUpdate, store, menfess);
			} else if (mek.message.conversation.startsWith('.balasmenfess')) {
			require("./confess")(alpha, m, chatUpdate, store, menfess);
			} else if (mek.message.conversation.startsWith('.tolakmenfess')) {
			require("./confess")(alpha, m, chatUpdate, store, menfess);
			}
        } catch (err) {
            console.log(err)
        }
    })

    // Setting
    alpha.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    
    alpha.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = alpha.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    alpha.getName = (jid, withoutContact  = false) => {
        id = alpha.decodeJid(jid)
        withoutContact = alpha.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = alpha.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === alpha.decodeJid(alpha.user.id) ?
            alpha.user :
            (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }
    
    alpha.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = []
        for (let i of kon) {
            list.push({
                displayName: await alpha.getName(i + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await alpha.getName(i + '@s.whatsapp.net')}\nFN:${await alpha.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            })
        }
        alpha.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })
    }
    
    alpha.public = true

    alpha.serializeM = (m) => smsg(alpha, m, store)

    alpha.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update	 
        if (qr) {
            app.use(async (req, res) => {
                res.setHeader('content-type', 'image/png')
                res.end(await toBuffer(qr))
            })
            app.use(express.static(path.join(__dirname, 'views')))
            app.listen(PORT, () => {
                console.log('App listened on port', PORT)
            })
        }
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.badSession) { console.log(`Bad Session File, Please Delete Session and Scan Again`); alpha.logout(); }
            else if (reason === DisconnectReason.connectionClosed) { console.log("Connection closed, reconnecting...."); Botstarted(); }
            else if (reason === DisconnectReason.connectionLost) { console.log("Connection Lost from Server, reconnecting..."); Botstarted(); }
            else if (reason === DisconnectReason.connectionReplaced) { console.log("Connection Replaced, Another New Session Opened, reconnecting..."); Botstarted(); }
            else if (reason === DisconnectReason.loggedOut) { console.log(`Device Logged Out, Please Scan Again And Run.`); alpha.logout(); }
            else if (reason === DisconnectReason.restartRequired) { console.log("Restart Required, Restarting..."); Botstarted(); }
            else if (reason === DisconnectReason.timedOut) { console.log("Connection TimedOut, Reconnecting..."); Botstarted(); }
            else if (reason === DisconnectReason.Multidevicemismatch) { console.log("Multi device mismatch, please scan again"); alpha.logout(); }
            else alpha.end
