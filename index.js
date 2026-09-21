// ═══════════════════════════════════════════════════════
// ⚡ 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲 - Main Entry
// ═══════════════════════════════════════════════════════

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getProfile } from './profile.js'
import { checkMessage, toggleProtection, toggleAllProtection } from './protection.js'
import {
  COMMANDS, matchCommand, buildMenu, getSectionContent,
  handleWelcome, handleWelcomeToggle,
  NOT_OWNER_MSG, getAnimeImage
} from './commands.js'
import { playXO, playGuess, playRPS, playDice } from './games.js'
import { askAI, generateImage } from './ai.js'
import { playMusic, searchMusic } from './music.js'
import { exposeMedia } from './expose.js'
import { decorateText, reverseText, calcExpression, randomQuote, randomJoke, randomFact } from './tools.js'
import {
  OWNER_NUMBER, BOT_NAME, BOT_NAME_SHORT,
  BOT_IMAGE, PREFIX, SESSION_DIR, SUB_BOTS_DIR,
  CHANNEL_LINK, OWNER_CONTACT, OWNER_NAME
} from './config.js'
import {
  isAdmin, isBotAdmin, getMentioned,
  kickMember, promoteMember, demoteMember,
  muteGroup, unmuteGroup, tagAll,
  getGroupLink, revokeLink, groupInfo
} from './admin.js'

const logger = pino({ level: 'silent' })
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ✅ المتغيرات العامة
if (!global.db) global.db = { data: { chats: {}, users: {} } }
if (!global.db.data.chats) global.db.data.chats = {}
if (!global.db.data.users) global.db.data.users = {}
if (!global.mutedUsers) global.mutedUsers = new Map()
if (!global.botMessages) global.botMessages = {}
if (!global.authorizedUsers) global.authorizedUsers = new Set()
if (!global.games) global.games = { xo: new Map(), guess: new Map(), rps: new Map() }

const AUTH_FILE = path.join(__dirname, 'authorized.json')
if (fs.existsSync(AUTH_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'))
    data.forEach(u => global.authorizedUsers.add(u))
  } catch (e) {}
}

function saveAuthorized() {
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(Array.from(global.authorizedUsers), null, 2))
  } catch (e) {}
}

if (!fs.existsSync(SUB_BOTS_DIR)) fs.mkdirSync(SUB_BOTS_DIR)

const activeBots = new Map()
const pendingCodes = new Map()
let isReconnecting = false
let reconnectCount = 0
let installOpen = false

// ═══════════════════════════════════════════════════════
// 🚀 البوت الرئيسي
// ═══════════════════════════════════════════════════════
async function startBot() {
  console.log(`\n🚀 جاري بدء ${BOT_NAME}...\n`)

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    browser: [BOT_NAME_SHORT, 'Chrome', '2.0.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false
  })

  sock.ev.on('creds.update', saveCreds)

  let qrShown = false

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !sock.authState.creds.registered) {
      if (!qrShown) {
        qrShown = true
        console.log('\n📱 امسح QR Code من واتساب:\n')
      }
      qrcode.generate(qr, { small: true })
      console.log('\n⚠️ صالح 30-40 ثانية\n')
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('⚠️ انقطع:', lastDisconnect?.error?.message)

      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ خروج — امسح session')
        return
      }

      if (!isReconnecting) {
        isReconnecting = true
        const waitTime = Math.min(reconnectCount * 10000, 120000)
        reconnectCount++
        setTimeout(() => {
          isReconnecting = false
          startBot()
        }, waitTime)
      }
    } else if (connection === 'open') {
      reconnectCount = 0
      console.log('\n✅ ' + BOT_NAME + ' شغال!')
      console.log('📱 ' + sock.user.id + '\n')
    }
  })

  sock.ev.on('group-participants.update', async (event) => {
    try {
      await handleWelcome(sock, event, global.db)
    } catch (e) {}
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')

    let text = msg.message.conversation
      || msg.message.extendedTextMessage?.text
      || msg.message.imageMessage?.caption
      || msg.message.videoMessage?.caption
      || ''

    if (!text) return

    const senderJid = msg.key.participant || msg.key.remoteJid
    const senderNum = senderJid.split('@')[0].split(':')[0]
    const isOwner = [
      senderNum === OWNER_NUMBER,
      senderJid.includes(OWNER_NUMBER),
      msg.key.fromMe,
      senderNum.endsWith(OWNER_NUMBER)
    ].some(v => v === true)

    let cmdText = text.replace(/^[.\/!#*]/, '').trim().toLowerCase()

    console.log(`📩 ${senderNum}: ${text} | مالك: ${isOwner}`)

    try {
      // ═══ الحماية ═══
      if (isGroup && !isOwner) {
        try {
          const userIsAdmin = await isAdmin(sock, from, senderJid)
          const chat = global.db.data.chats[from] || {}
          const blocked = await checkMessage(sock, msg, from, isGroup, isOwner, userIsAdmin, chat)
          if (blocked) return
        } catch (e) {}
      }

      // ═══ فحص المكتومين ═══
      if (global.mutedUsers.has(senderJid) && !isOwner) {
        try {
          await sock.sendMessage(from, { delete: msg.key })
          await sock.sendMessage(from, {
            text: `ٱخـ̐ــ̐͢ـ͓ـ̐ـ͢ـ͓̐ـ٭ٰ۬ۛﹻ٭ٰ۬ۛﹻــرس يبــۥـ℘ـۥــن م⃟راتـــ۬ۦٕ٘۬ 𖥡ﹻٰ۬ۛۛــي @${senderNum}*\n\n📌 انت مكتوم`,
            mentions: [senderJid]
          })
          return
        } catch (e) {}
      }

      // ═══ تست ═══
      if (matchCommand(text, COMMANDS.test)) {
        try {
          const videoPath = path.join(__dirname, 'test_note.mp4')
          if (!fs.existsSync(videoPath)) {
            return sock.sendMessage(from, { text: '❌ الفيديو مش موجود' }, { quoted: msg })
          }
          await sock.sendMessage(from, {
            video: fs.readFileSync(videoPath),
            mimetype: 'video/mp4',
            ptv: true
          }, { quoted: msg })
        } catch (e) {}
        return
      }

// ═══ بروفايل ═══
if (matchCommand(text, COMMANDS.profile)) {
  const target = getMentioned(msg)
  if (!target) {
    return sock.sendMessage(from, { text: '❌ اعمل منشن للعضو أو رد على رسالته' }, { quoted: msg })
  }
  return getProfile(sock, from, msg, target)
}


      // ═══ ping ═══
      if (matchCommand(text, COMMANDS.ping)) {
        const start = Date.now()
        const animeUrl = getAnimeImage('neko')
        if (animeUrl) {
          return sock.sendMessage(from, {
            image: { url: animeUrl },
            caption: `🏓 *Pong!*\n⚡ ${Date.now() - start}ms`
          }, { quoted: msg })
        }
        return sock.sendMessage(from, { text: `🏓 *Pong!*\n⚡ ${Date.now() - start}ms` }, { quoted: msg })
      }

      // ═══ menu ═══
      if (matchCommand(text, COMMANDS.menu)) {
        const menuText = `╭━━━ ⚡ *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ⚡ ━━━╮
┃
┃ 📋 *الأوامر العامة*
┃
┃ 🔹 بينج / ping
┃ 🔹 المالك / owner
┃ 🔹 الوقت / time
┃ 🔹 معلومات / info
┃ 🔹 تنصيب
┃ 🔹 تست
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🎵 *المشغل* ━━━╮
┃
┃ 🔹 تشغيل [اسم أغنية]
┃ 🔹 بحث [كلمة]
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🤖 *الذكاء الاصطناعي* ━━━╮
┃
┃ 🔹 ذكاء [سؤال]
┃ 🔹 صوره [وصف]
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🎮 *الألعاب* ━━━╮
┃
┃ 🔹 نرد
┃ 🔹 اكس او @عضو
┃ 🔹 تخمين
┃ 🔹 حجر ورقة مقص
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🛠️ *الأدوات* ━━━╮
┃
┃ 🔹 زخرفة [نص]
┃ 🔹 عكس [نص]
┃ 🔹 حاسبة [عملية]
┃ 🔹 اقتباس
┃ 🔹 نكتة
┃ 🔹 هل تعلم
┃
╰━━━━━━━━━━━━━━━╯

━━━━━━━━━━━━━━━
📌 *للمزيد:*
🔹 *ادمن* — أوامر الإدارة
🔹 *اونر* — أوامر المالك

👑 ${OWNER_NAME}
𝑩𝑶𝑻 𝑫𝑨𝑹𝑲 © 2026`

        const animeUrl = getAnimeImage('waifu')
        if (animeUrl) {
          await sock.sendMessage(from, {
            image: { url: animeUrl },
            caption: menuText,
            mentions: [senderJid]
          }, { quoted: msg })
        } else {
          await sock.sendMessage(from, { text: menuText, mentions: [senderJid] }, { quoted: msg })
        }

        try {
          const videoPath = path.join(__dirname, 'test_note.mp4')
          if (fs.existsSync(videoPath)) {
            await new Promise(r => setTimeout(r, 1500))
            await sock.sendMessage(from, {
              video: fs.readFileSync(videoPath),
              mimetype: 'video/mp4',
              ptv: true
            })
          }
        } catch (e) {}
        return
      }

      // ═══ ادمن ═══
      if (matchCommand(text, COMMANDS.admin_menu)) {
        return sock.sendMessage(from, { text: getSectionContent('admin') }, { quoted: msg })
      }

      // ═══ اونر ═══
      if (matchCommand(text, COMMANDS.owner_menu)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        return sock.sendMessage(from, { text: getSectionContent('owner') }, { quoted: msg })
      }

      // ═══ owner ═══
      if (matchCommand(text, COMMANDS.owner)) {
        return sock.sendMessage(from, { text: `👑 *المالك:* ${OWNER_NAME}\n🔗 ${OWNER_CONTACT}` }, { quoted: msg })
      }

      // ═══ time ═══
      if (matchCommand(text, COMMANDS.time)) {
        const now = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })
        return sock.sendMessage(from, { text: `🕐 *الوقت:* ${now}` }, { quoted: msg })
      }

      // ═══ info ═══
      if (matchCommand(text, COMMANDS.info)) {
        return sock.sendMessage(from, { text: `⚡ ${BOT_NAME}\n👑 ${OWNER_NAME}\n📊 بوتات: ${activeBots.size}\n⏱️ ${formatUptime()}` }, { quoted: msg })
      }

      // ═══ قائمة التفعيل ═══
      if (matchCommand(text, COMMANDS.activationMenu)) {
        const chat = global.db.data.chats[from] || {}
        const menu = `╭━━━ ⚡ *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ⚡ ━━━╮
┃
┃ 🎛️ *قائمة التفعيلات*
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🛡️ *الحماية* ━━━╮
┃
┃ 🚫 منع الروابط: ${chat.antilink ? '✅' : '❌'}
┃ 🤬 منع الشتائم: ${chat.antibad ? '✅' : '❌'}
┃ 📸 منع الاستوري: ${chat.antiviewonce ? '✅' : '❌'}
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 👋 *الترحيب* ━━━╮
┃
┃ 🎉 الترحيب: ${chat.welcome ? '✅' : '❌'}
┃
╰━━━━━━━━━━━━━━━╯`
        return sock.sendMessage(from, { text: menu }, { quoted: msg })
      }

      // ═══ الحماية (أوامر) ═══
      if (isGroup) {
        const userIsAdmin = isOwner || await isAdmin(sock, from, senderJid)

        if (matchCommand(text, COMMANDS.enableAntilink)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antilink', true)
        }
        if (matchCommand(text, COMMANDS.disableAntilink)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antilink', false)
        }
        if (matchCommand(text, COMMANDS.enableAntibad)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antibad', true)
        }
        if (matchCommand(text, COMMANDS.disableAntibad)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antibad', false)
        }
        if (matchCommand(text, COMMANDS.enableAntiviewonce)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antiviewonce', true)
        }
        if (matchCommand(text, COMMANDS.disableAntiviewonce)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antiviewonce', false)
        }
        if (matchCommand(text, COMMANDS.antilink)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antilink', !chat.antilink)
        }
        if (matchCommand(text, COMMANDS.antibad)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antibad', !chat.antibad)
        }
        if (matchCommand(text, COMMANDS.antiviewonce)) {
          if (!userIsAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
          const chat = global.db.data.chats[from] || {}
          return toggleProtection(sock, from, msg, chat, global.db, 'antiviewonce', !chat.antiviewonce)
        }
      }

      // ═══ الألعاب ═══
      if (matchCommand(text, COMMANDS.xo)) return playXO(sock, from, msg, senderJid, senderNum)
      if (matchCommand(text, COMMANDS.guess)) return playGuess(sock, from, msg, senderJid, senderNum)
      if (matchCommand(text, COMMANDS.rps)) return playRPS(sock, from, msg, senderJid, senderNum)
      if (matchCommand(text, COMMANDS.dice)) return playDice(sock, from, msg, senderJid, senderNum)

      // ═══ تشغيل ═══
      if (text.trim().startsWith('تشغيل') || text.trim().startsWith('شغل ') || text.trim().startsWith('play ')) {
        const query = text.replace(/^[.\/!#*]?\s*(تشغيل|شغل|play)\s*/, '').trim()
        if (query.length >= 2) return playMusic(sock, from, msg, query)
      }

      // ═══ بحث ═══
      if (text.trim().startsWith('بحث') || text.trim().startsWith('search ')) {
        const query = text.replace(/^[.\/!#*]?\s*(بحث|search)\s*/, '').trim()
        if (query.length >= 2) return searchMusic(sock, from, msg, query)
      }

      // ═══ ذكاء ═══
      if (text.trim().startsWith('ذكاء') || text.trim().startsWith('ai ') || text.trim().startsWith('اسأل')) {
        const question = text.replace(/^[.\/!#*]?\s*(ذكاء|ai|اسأل)\s*/, '').trim()
        if (question.length >= 2) return askAI(sock, from, msg, question)
      }

      // ═══ صوره ═══
      if (text.trim().startsWith('صوره') || text.trim().startsWith('image ') || text.trim().startsWith('img ')) {
        const prompt = text.replace(/^[.\/!#*]?\s*(صوره|image|img)\s*/, '').trim()
        if (prompt.length >= 2) return generateImage(sock, from, msg, prompt)
      }

      // ═══ زخرفة ═══
      if (text.trim().startsWith('زخرفة') || text.trim().startsWith('decorate ')) {
        const t = text.replace(/^[.\/!#*]?\s*(زخرفة|decorate)\s*/, '').trim()
        if (t.length >= 1) return decorateText(sock, from, msg, t)
      }

      // ═══ عكس ═══
      if (text.trim().startsWith('عكس') || text.trim().startsWith('reverse ')) {
        const t = text.replace(/^[.\/!#*]?\s*(عكس|reverse)\s*/, '').trim()
        if (t.length >= 1) return reverseText(sock, from, msg, t)
      }

      // ═══ حاسبة ═══
      if (text.trim().startsWith('حاسبة') || text.trim().startsWith('احسب') || text.trim().startsWith('calc ')) {
        const t = text.replace(/^[.\/!#*]?\s*(حاسبة|احسب|calc)\s*/, '').trim()
        if (t.length >= 1) return calcExpression(sock, from, msg, t)
      }

      // ═══ اقتباس ═══
      if (matchCommand(text, COMMANDS.quote)) return randomQuote(sock, from, msg)

      // ═══ نكتة ═══
      if (matchCommand(text, COMMANDS.joke)) return randomJoke(sock, from, msg)

      // ═══ هل تعلم ═══
      if (matchCommand(text, COMMANDS.fact)) return randomFact(sock, from, msg)

      // ═══ فضح ═══
      if (matchCommand(text, COMMANDS.expose) && isGroup) return exposeMedia(sock, from, msg, senderJid)

      // ═══ مسح ═══
      if (matchCommand(text, COMMANDS.clear)) {
        const isUserAdmin = isOwner || (isGroup && await isAdmin(sock, from, senderJid))
        if (!isUserAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })

        const quotedId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant

        if (quotedId && quotedParticipant) {
          try {
            await sock.sendMessage(from, {
              delete: { remoteJid: from, fromMe: quotedParticipant === sock.user.id, id: quotedId, participant: quotedParticipant }
            })
            return
          } catch (e) {}
        }
        return sock.sendMessage(from, { text: '❌ رد على رسالة عشان تمسحها' }, { quoted: msg })
      }

      // ═══ مسح الكل ═══
      if (matchCommand(text, COMMANDS.clearAll)) {
        const isUserAdmin = isOwner || (isGroup && await isAdmin(sock, from, senderJid))
        if (!isUserAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })

        const messages = global.botMessages?.[from] || []
        let deleted = 0
        for (const m of messages) {
          try {
            await sock.sendMessage(from, { delete: m.key })
            deleted++
          } catch (e) {}
        }
        global.botMessages[from] = []
        return sock.sendMessage(from, { text: `✅ *تم مسح ${deleted} رسالة*` }, { quoted: msg })
      }

      // ═══ تنصيب ═══
      if (matchCommand(text, COMMANDS.install)) {
        if (!installOpen && !isOwner) {
          return sock.sendMessage(from, { text: `🔒 *التنصيب مقفول*` }, { quoted: msg })
        }
        await sock.sendMessage(from, {
          text: `📱 *تنصيب بوت جديد*\n\nابعت رقمك مع كود الدولة\n⚠️ بدون + وبدون 0`
        }, { quoted: msg })
        pendingCodes.set(from, { step: 'awaiting_number', time: Date.now() })
        return
      }

      const pending = pendingCodes.get(from)
      if (pending && pending.step === 'awaiting_number') {
        const number = text.replace(/[^0-9]/g, '')
        if (number.length < 10 || number.length > 15) {
          return sock.sendMessage(from, { text: '❌ رقم غلط!' }, { quoted: msg })
        }
        if (activeBots.has(number)) {
          pendingCodes.delete(from)
          return sock.sendMessage(from, { text: '⚠️ البوت شغال!' }, { quoted: msg })
        }
        await sock.sendMessage(from, { text: '⏳ جاري التنصيب...' }, { quoted: msg })
        pendingCodes.delete(from)
        createSubBot(number, from, sock).catch(console.error)
        return
      }

      // ═══ فتح/قفل ═══
      if (cmdText === 'فتح تنصيب') {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        installOpen = true
        return sock.sendMessage(from, { text: '✅ *تم فتح التنصيب*' }, { quoted: msg })
      }
      if (cmdText === 'قفل تنصيب') {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        installOpen = false
        return sock.sendMessage(from, { text: '🔒 *تم قفل التنصيب*' }, { quoted: msg })
      }

      // ═══ كتم ═══
      if (matchCommand(text, COMMANDS.mute_member)) {
        const a = isOwner || (isGroup && await isAdmin(sock, from, senderJid))
        if (!a) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
        const target = getMentioned(msg)
        if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
        const targetNum = target.split('@')[0].split(':')[0]
        if (targetNum === OWNER_NUMBER) return sock.sendMessage(from, { text: '❌ المالك مستثنى' }, { quoted: msg })
        global.mutedUsers.set(target, { by: senderJid, time: Date.now() })
        return sock.sendMessage(from, { text: `✅ *تم كتم @${targetNum}*`, mentions: [target] }, { quoted: msg })
      }

      // ═══ فك كتم ═══
      if (matchCommand(text, COMMANDS.unmute_member)) {
        const a = isOwner || (isGroup && await isAdmin(sock, from, senderJid))
        if (!a) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
        const target = getMentioned(msg)
        if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
        global.mutedUsers.delete(target)
        return sock.sendMessage(from, { text: `✅ *تم فك الكتم*`, mentions: [target] }, { quoted: msg })
      }

      // ═══ المكتومين ═══
      if (matchCommand(text, COMMANDS.mutedList)) {
        if (global.mutedUsers.size === 0) {
          return sock.sendMessage(from, { text: '📭 مفيش حد مكتوم' }, { quoted: msg })
        }
        let list = '🤐 *المكتومين:*\n\n'
        let i = 1
        for (const [jid] of global.mutedUsers) {
          list += `${i}. @${jid.split('@')[0]}\n`
          i++
        }
        return sock.sendMessage(from, { text: list, mentions: Array.from(global.mutedUsers.keys()) }, { quoted: msg })
      }

      // ═══ الترحيب ═══
      if (matchCommand(text, COMMANDS.onWelcome) && isGroup) {
        const a = isOwner || await isAdmin(sock, from, senderJid)
        if (a) return handleWelcomeToggle(sock, from, msg, true, global.db)
      }
      if (matchCommand(text, COMMANDS.offWelcome) && isGroup) {
        const a = isOwner || await isAdmin(sock, from, senderJid)
        if (a) return handleWelcomeToggle(sock, from, msg, false, global.db)
      }

      // ═══ أوامر الإدارة ═══
      if (isGroup) {
        const userIsAdmin = isOwner || await isAdmin(sock, from, senderJid)
        const botIsAdmin = await isBotAdmin(sock, from)

        if (matchCommand(text, COMMANDS.kick) && userIsAdmin && botIsAdmin) return kickMember(sock, from, msg, getMentioned(msg))
        if (matchCommand(text, COMMANDS.promote) && userIsAdmin && botIsAdmin) return promoteMember(sock, from, msg, getMentioned(msg))
        if (matchCommand(text, COMMANDS.demote) && userIsAdmin && botIsAdmin) return demoteMember(sock, from, msg, getMentioned(msg))
        if (matchCommand(text, COMMANDS.mute) && userIsAdmin && botIsAdmin) return muteGroup(sock, from, msg)
        if (matchCommand(text, COMMANDS.unmute) && userIsAdmin && botIsAdmin) return unmuteGroup(sock, from, msg)
        if (matchCommand(text, COMMANDS.tagall) && userIsAdmin) return tagAll(sock, from, msg, '')
        if (matchCommand(text, COMMANDS.groupLink) && userIsAdmin && botIsAdmin) return getGroupLink(sock, from, msg)
        if (matchCommand(text, COMMANDS.revoke) && userIsAdmin && botIsAdmin) return revokeLink(sock, from, msg)
        if (matchCommand(text, COMMANDS.groupInfo)) return groupInfo(sock, from, msg)
      }

      // ═══ اضف فرعي ═══
      if (matchCommand(text, COMMANDS.addSubBot)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        const target = getMentioned(msg)
        if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
        const targetNum = target.split('@')[0].split(':')[0]
        global.authorizedUsers.add(targetNum)
        global.authorizedUsers.add(target)
        saveAuthorized()
        return sock.sendMessage(from, { text: `✅ *تم اضافة الفرعي*`, mentions: [target] }, { quoted: msg })
      }

      // ═══ امسح فرعي ═══
      if (matchCommand(text, COMMANDS.removeSubBot)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        const target = getMentioned(msg)
        if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
        const targetNum = target.split('@')[0].split(':')[0]
        global.authorizedUsers.delete(targetNum)
        global.authorizedUsers.delete(target)
        saveAuthorized()
        return sock.sendMessage(from, { text: `✅ *تم مسح الفرعي*`, mentions: [target] }, { quoted: msg })
      }

      // ═══ الفروع ═══
      if (matchCommand(text, COMMANDS.subBotsList)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        if (global.authorizedUsers.size === 0) {
          return sock.sendMessage(from, { text: '📭 مفيش فروع' }, { quoted: msg })
        }
        let list = '📋 *الفروع:*\n\n'
        let i = 1
        for (const u of global.authorizedUsers) {
          list += `${i}. \`${u}\`\n`
          i++
        }
        return sock.sendMessage(from, { text: list }, { quoted: msg })
      }

      // ═══ البوتات ═══
      if (matchCommand(text, COMMANDS.bots)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        if (activeBots.size === 0) {
          return sock.sendMessage(from, { text: '📭 مفيش بوتات' }, { quoted: msg })
        }
        let list = '📋 *البوتات:*\n\n'
        let i = 1
        for (const [num] of activeBots) {
          list += `${i}. \`${num}\`\n`
          i++
        }
        return sock.sendMessage(from, { text: list }, { quoted: msg })
      }

      // ═══ الغاء ═══
      if (matchCommand(text, COMMANDS.cancel)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        pendingCodes.delete(from)
        return sock.sendMessage(from, { text: '✅ تم الإلغاء' }, { quoted: msg })
      }

      // ═══ قول ═══
      if (cmdText.startsWith('say ') || cmdText.startsWith('قول ')) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        const sayText = cmdText.replace(/^(say|قول)\s+/, '')
        if (sayText) return sock.sendMessage(from, { text: sayText }, { quoted: msg })
      }

    } catch (err) {
      console.log('❌ خطأ:', err.message)
    }
  })
}

// ═══════════════════════════════════════════════════════
// 🔧 البوت الفرعي
// ═══════════════════════════════════════════════════════
async function createSubBot(phoneNumber, requesterJid, mainSock) {
  const botDir = path.join(SUB_BOTS_DIR, phoneNumber)
  if (fs.existsSync(botDir)) fs.rmSync(botDir, { recursive: true, force: true })
  fs.mkdirSync(botDir, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(botDir)
  const { version } = await fetchLatestBaileysVersion()

  const subSock = makeWASocket({
    version,
    logger,
    auth: state,
    browser: ['DARK-SUB', 'Chrome', '2.0.0'],
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false
  })

  subSock.ev.on('creds.update', saveCreds)

  let codeSent = false
  let qrSent = false

  subSock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr && !subSock.authState.creds.registered && !qrSent) {
      qrSent = true
      console.log(`\n📱 QR للبوت الفرعي: ${phoneNumber}\n`)
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => {
          activeBots.delete(phoneNumber)
          createSubBot(phoneNumber, requesterJid, mainSock).catch(console.error)
        }, 15000)
      } else {
        activeBots.delete(phoneNumber)
      }
    }

    if (connection === 'open') {
      console.log(`✅ بوت فرعي: ${phoneNumber}`)
      activeBots.set(phoneNumber, subSock)
      await mainSock.sendMessage(requesterJid, {
        text: `✅ *تم التنصيب بنجاح!*\n📱 ${phoneNumber}`
      }).catch(() => {})
    }
  })

  setTimeout(async () => {
    if (codeSent) return
    if (subSock.authState.creds.registered) return

    codeSent = true
    try {
      const code = await subSock.requestPairingCode(phoneNumber)
      const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code
      console.log(`🔑 كود ${phoneNumber}: ${formattedCode}`)
      await mainSock.sendMessage(requesterJid, {
        text: `╭━━━ ⚡ *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ⚡ ━━━╮
┃
┃ 🔑 *كود الإقران:*
┃
┃ *${formattedCode}*
┃
┃ 📌 الإعدادات → الأجهزة المرتبطة
┃ → ربط جهاز → الربط برقم الهاتف
┃
┃ ⚠️ الكود صالح 5 دقائق
┃
╰━━━━━ 𝑫𝑨𝑹𝑲 ━━━━━╯`
      }).catch(() => {})
    } catch (err) {
      console.log(`❌ فشل كود ${phoneNumber}: ${err.message}`)
    }
  }, 3000)

  subSock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    if (!msg.message) return
    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    if (!text) return

    try {
      if (matchCommand(text, COMMANDS.ping)) {
        await subSock.sendMessage(from, { text: '🏓 Pong!' }, { quoted: msg })
      } else if (matchCommand(text, COMMANDS.menu)) {
        await subSock.sendMessage(from, { text: buildMenu() }, { quoted: msg })
      } else if (matchCommand(text, COMMANDS.owner)) {
        await subSock.sendMessage(from, { text: `👑 ${OWNER_NAME}` }, { quoted: msg })
      }
    } catch (e) {}
  })
}

// ═══════════════════════════════════════════════════════
// 🛠️ أدوات
// ═══════════════════════════════════════════════════════
function formatUptime() {
  const u = process.uptime()
  const h = Math.floor(u / 3600)
  const m = Math.floor((u % 3600) / 60)
  const s = Math.floor(u % 60)
  return `${h}س ${m}د ${s}ث`
}

process.on('uncaughtException', (err) => console.log('❌', err.message))
process.on('unhandledRejection', (err) => console.log('❌', err?.message || err))

startBot().catch(err => console.error('❌', err.message))
