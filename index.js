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

import { checkMessage, toggleProtection } from './protection.js'
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
  SESSION_DIR, SUB_BOTS_DIR, CHANNEL_LINK, OWNER_CONTACT, OWNER_NAME
} from './config.js'
import {
  isAdmin, isBotAdmin, getMentioned,
  kickMember, promoteMember, demoteMember,
  muteGroup, unmuteGroup, tagAll,
  getGroupLink, revokeLink, groupInfo
} from './admin.js'

const logger = pino({ level: 'silent' })
const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!global.db) global.db = { data: { chats: {}, users: {} } }
if (!global.db.data.chats) global.db.data.chats = {}
if (!global.db.data.users) global.db.data.users = {}
if (!global.mutedUsers) global.mutedUsers = new Map()
if (!global.botMessages) global.botMessages = {}
if (!global.authorizedUsers) global.authorizedUsers = new Set()
if (!global.games) global.games = { xo: new Map(), guess: new Map(), rps: new Map() }
if (!global.installCooldown) global.installCooldown = new Map()
if (!global.subBotCooldown) global.subBotCooldown = new Map()

const activeBots = new Map()
const pendingCodes = new Map()
let isReconnecting = false
let reconnectCount = 0
let installOpen = true

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
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('⚠️ انقطع:', lastDisconnect?.error?.message)

      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ خروج')
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
      // حماية
      if (isGroup && !isOwner) {
        try {
          const userIsAdmin = await isAdmin(sock, from, senderJid)
          const chat = global.db.data.chats[from] || {}
          const blocked = await checkMessage(sock, msg, from, isGroup, isOwner, userIsAdmin, chat)
          if (blocked) return
        } catch (e) {}
      }

      // مكتومين
      if (global.mutedUsers.has(senderJid) && !isOwner) {
        try {
          await sock.sendMessage(from, { delete: msg.key })
          await sock.sendMessage(from, {
            text: `🤐 *اسكت يا @${senderNum}*`,
            mentions: [senderJid]
          })
          return
        } catch (e) {}
      }

      // تست
      if (matchCommand(text, COMMANDS.test)) {
        try {
          const videoPath = path.join(__dirname, 'test_note.mp4')
          if (fs.existsSync(videoPath)) {
            await sock.sendMessage(from, {
              video: fs.readFileSync(videoPath),
              mimetype: 'video/mp4',
              ptv: true
            }, { quoted: msg })
          }
        } catch (e) {}
        return
      }

      // ping
      if (matchCommand(text, COMMANDS.ping)) {
        const start = Date.now()
        return sock.sendMessage(from, { text: `🏓 *Pong!*\n⚡ ${Date.now() - start}ms` }, { quoted: msg })
      }

      // menu بأزرار
      if (matchCommand(text, COMMANDS.menu)) {
        const menuText = `🔸 *${BOT_NAME}* 🔸

👤 *المستخدم:* @${senderNum}
⚙️ *التشغيل:* ${formatUptime()}

📋 *اختر قسم من القائمة:*`

        try {
          console.log('🔵 جاري إرسال الأزرار...')
          const { sendInteractiveMessage } = await import('flowleys-helper')
          console.log('🔵 flowleys-helper اتحمل')

          await sendInteractiveMessage(sock, from, {
            text: menuText,
            footer: `${BOT_NAME} © 2026`,
            interactiveButtons: [
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📋 أوامر عامة', id: 'menu_general' }) },
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🛡️ الإدارة', id: 'menu_admin' }) },
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎮 الألعاب', id: 'menu_games' }) },
              { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🛠️ الأدوات', id: 'menu_tools' }) }
            ]
          }, { quoted: msg })

          console.log('✅ الأزرار اتبعتت')
          return
        } catch (e) {
          console.log('❌ فشل إرسال الأزرار:', e.message)
          return sock.sendMessage(from, { text: menuText + '\n\n📌 اكتب *ادمن* للمزيد' }, { quoted: msg })
        }
      }

      // معالجة الأزرار
      const buttonId = msg.message?.buttonsResponseMessage?.selectedButtonId
        || msg.message?.templateButtonReplyMessage?.selectedId
        || msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.id

      if (buttonId) {
        let responseText = ''
        if (buttonId === 'menu_general') responseText = '📋 *الأوامر العامة:*\n\n🔹 بينج\n🔹 المالك\n🔹 الوقت\n🔹 معلومات\n🔹 تنصيب\n🔹 تست'
        else if (buttonId === 'menu_admin') responseText = getSectionContent('admin')
        else if (buttonId === 'menu_games') responseText = '🎮 *الألعاب:*\n\n🔹 نرد\n🔹 تخمين\n🔹 حجر ورقة مقص'
        else if (buttonId === 'menu_tools') responseText = '🛠️ *الأدوات:*\n\n🔹 زخرفة\n🔹 عكس\n🔹 حاسبة\n🔹 اقتباس\n🔹 نكتة\n🔹 هل تعلم'

        if (responseText) return sock.sendMessage(from, { text: responseText }, { quoted: msg })
      }

      // ادمن
      if (matchCommand(text, COMMANDS.admin_menu)) {
        return sock.sendMessage(from, { text: getSectionContent('admin') }, { quoted: msg })
      }

      // اونر
      if (matchCommand(text, COMMANDS.owner_menu)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        return sock.sendMessage(from, { text: getSectionContent('owner') }, { quoted: msg })
      }

      // owner
      if (matchCommand(text, COMMANDS.owner)) {
        return sock.sendMessage(from, { text: `👑 *${OWNER_NAME}*\n🔗 ${OWNER_CONTACT}` }, { quoted: msg })
      }

      // time
      if (matchCommand(text, COMMANDS.time)) {
        const now = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })
        return sock.sendMessage(from, { text: `🕐 ${now}` }, { quoted: msg })
      }

      // info
      if (matchCommand(text, COMMANDS.info)) {
        return sock.sendMessage(from, { text: `⚡ ${BOT_NAME}\n👑 ${OWNER_NAME}\n📊 بوتات: ${activeBots.size}\n⏱️ ${formatUptime()}` }, { quoted: msg })
      }

      // تفعيل
      if (matchCommand(text, COMMANDS.activationMenu)) {
        const chat = global.db.data.chats[from] || {}
        return sock.sendMessage(from, {
          text: `🎛️ *الحماية*\n\n🚫 الروابط: ${chat.antilink ? '✅' : '❌'}\n🤬 الشتائم: ${chat.antibad ? '✅' : '❌'}\n📸 الاستوري: ${chat.antiviewonce ? '✅' : '❌'}`
        }, { quoted: msg })
      }

      // أوامر الحماية
      if (isGroup) {
        const userIsAdmin = isOwner || await isAdmin(sock, from, senderJid)
        const chat = global.db.data.chats[from] || {}

        if (matchCommand(text, COMMANDS.enableAntilink) && userIsAdmin) return toggleProtection(sock, from, msg, chat, global.db, 'antilink', true)
        if (matchCommand(text, COMMANDS.disableAntilink) && userIsAdmin) return toggleProtection(sock, from, msg, chat, global.db, 'antilink', false)
        if (matchCommand(text, COMMANDS.enableAntibad) && userIsAdmin) return toggleProtection(sock, from, msg, chat, global.db, 'antibad', true)
        if (matchCommand(text, COMMANDS.disableAntibad) && userIsAdmin) return toggleProtection(sock, from, msg, chat, global.db, 'antibad', false)
        if (matchCommand(text, COMMANDS.enableAntiviewonce) && userIsAdmin) return toggleProtection(sock, from, msg, chat, global.db, 'antiviewonce', true)
        if (matchCommand(text, COMMANDS.disableAntiviewonce) && userIsAdmin) return toggleProtection(sock, from, msg, chat, global.db, 'antiviewonce', false)
      }

      // ألعاب
      if (matchCommand(text, COMMANDS.xo)) return playXO(sock, from, msg, senderJid, senderNum)
      if (matchCommand(text, COMMANDS.guess)) return playGuess(sock, from, msg, senderJid, senderNum)
      if (matchCommand(text, COMMANDS.rps)) return playRPS(sock, from, msg, senderJid, senderNum)
      if (matchCommand(text, COMMANDS.dice)) return playDice(sock, from, msg, senderJid, senderNum)

      // تشغيل
      if (text.trim().startsWith('تشغيل') || text.trim().startsWith('شغل ')) {
        const query = text.replace(/^[.\/!#*]?\s*(تشغيل|شغل)\s*/, '').trim()
        if (query.length >= 2) return playMusic(sock, from, msg, query)
      }

      // بحث
      if (text.trim().startsWith('بحث')) {
        const query = text.replace(/^[.\/!#*]?\s*بحث\s*/, '').trim()
        if (query.length >= 2) return searchMusic(sock, from, msg, query)
      }

      // ذكاء
      if (text.trim().startsWith('ذكاء')) {
        const question = text.replace(/^[.\/!#*]?\s*ذكاء\s*/, '').trim()
        if (question.length >= 2) return askAI(sock, from, msg, question)
      }

      // صوره
      if (text.trim().startsWith('صوره')) {
        const prompt = text.replace(/^[.\/!#*]?\s*صوره\s*/, '').trim()
        if (prompt.length >= 2) return generateImage(sock, from, msg, prompt)
      }

      // زخرفة
      if (text.trim().startsWith('زخرفة')) {
        const t = text.replace(/^[.\/!#*]?\s*زخرفة\s*/, '').trim()
        if (t.length >= 1) return decorateText(sock, from, msg, t)
      }

      // عكس
      if (text.trim().startsWith('عكس')) {
        const t = text.replace(/^[.\/!#*]?\s*عكس\s*/, '').trim()
        if (t.length >= 1) return reverseText(sock, from, msg, t)
      }

      // حاسبة
      if (text.trim().startsWith('حاسبة') || text.trim().startsWith('احسب')) {
        const t = text.replace(/^[.\/!#*]?\s*(حاسبة|احسب)\s*/, '').trim()
        if (t.length >= 1) return calcExpression(sock, from, msg, t)
      }

      // اقتباس
      if (matchCommand(text, COMMANDS.quote)) return randomQuote(sock, from, msg)
      if (matchCommand(text, COMMANDS.joke)) return randomJoke(sock, from, msg)
      if (matchCommand(text, COMMANDS.fact)) return randomFact(sock, from, msg)

      // فضح
      if (matchCommand(text, COMMANDS.expose) && isGroup) return exposeMedia(sock, from, msg, senderJid)

      // مسح
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

      // مسح الكل
      if (matchCommand(text, COMMANDS.clearAll)) {
        const isUserAdmin = isOwner || (isGroup && await isAdmin(sock, from, senderJid))
        if (!isUserAdmin) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })

        const msgs = global.botMessages?.[from] || []
        let deleted = 0
        for (const m of msgs) {
          try { await sock.sendMessage(from, { delete: m.key }); deleted++ } catch (e) {}
        }
        global.botMessages[from] = []
        return sock.sendMessage(from, { text: `✅ تم مسح ${deleted} رسالة` }, { quoted: msg })
      }

      // تنصيب
      if (matchCommand(text, COMMANDS.install)) {
        if (!installOpen && !isOwner) return sock.sendMessage(from, { text: '🔒 التنصيب مقفول' }, { quoted: msg })

        const lastReq = global.installCooldown.get(from) || 0
        if (Date.now() - lastReq < 50000 && !isOwner) {
          const rem = Math.ceil((50000 - (Date.now() - lastReq)) / 1000)
          return sock.sendMessage(from, { text: `⏳ استنى ${rem} ثانية` }, { quoted: msg })
        }
        global.installCooldown.set(from, Date.now())

        await sock.sendMessage(from, {
          text: `📱 *تنصيب بوت جديد*\n\nابعت رقمك مع كود الدولة\n⚠️ بدون + وبدون 0`
        }, { quoted: msg })
        pendingCodes.set(from, { step: 'awaiting_number', time: Date.now() })
        return
      }

      // رقم للتنصيب
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

      // فتح/قفل
      if (cmdText === 'فتح تنصيب') {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        installOpen = true
        return sock.sendMessage(from, { text: '✅ تم فتح التنصيب' }, { quoted: msg })
      }
      if (cmdText === 'قفل تنصيب') {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        installOpen = false
        return sock.sendMessage(from, { text: '🔒 تم قفل التنصيب' }, { quoted: msg })
      }

      // كتم
      if (matchCommand(text, COMMANDS.mute_member)) {
        const a = isOwner || (isGroup && await isAdmin(sock, from, senderJid))
        if (!a) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
        const target = getMentioned(msg)
        if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
        const targetNum = target.split('@')[0].split(':')[0]
        if (targetNum === OWNER_NUMBER) return sock.sendMessage(from, { text: '❌ المالك مستثنى' }, { quoted: msg })
        global.mutedUsers.set(target, { by: senderJid, time: Date.now() })
        return sock.sendMessage(from, { text: `✅ تم كتم @${targetNum}`, mentions: [target] }, { quoted: msg })
      }

      // فك كتم
      if (matchCommand(text, COMMANDS.unmute_member)) {
        const a = isOwner || (isGroup && await isAdmin(sock, from, senderJid))
        if (!a) return sock.sendMessage(from, { text: '❌ للمشرفين بس' }, { quoted: msg })
        const target = getMentioned(msg)
        if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
        global.mutedUsers.delete(target)
        return sock.sendMessage(from, { text: `✅ تم فك الكتم`, mentions: [target] }, { quoted: msg })
      }

      // المكتومين
      if (matchCommand(text, COMMANDS.mutedList)) {
        if (global.mutedUsers.size === 0) return sock.sendMessage(from, { text: '📭 مفيش حد مكتوم' }, { quoted: msg })
        let list = '🤐 المكتومين:\n\n'
        let i = 1
        for (const [jid] of global.mutedUsers) { list += `${i}. @${jid.split('@')[0]}\n`; i++ }
        return sock.sendMessage(from, { text: list, mentions: Array.from(global.mutedUsers.keys()) }, { quoted: msg })
      }

      // الترحيب
      if (matchCommand(text, COMMANDS.onWelcome) && isGroup) {
        const a = isOwner || await isAdmin(sock, from, senderJid)
        if (a) return handleWelcomeToggle(sock, from, msg, true, global.db)
      }
      if (matchCommand(text, COMMANDS.offWelcome) && isGroup) {
        const a = isOwner || await isAdmin(sock, from, senderJid)
        if (a) return handleWelcomeToggle(sock, from, msg, false, global.db)
      }

      // أوامر الإدارة
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

      // اضف فرعي
      if (matchCommand(text, COMMANDS.addSubBot)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        const target = getMentioned(msg)
        if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
        const targetNum = target.split('@')[0].split(':')[0]
        global.authorizedUsers.add(targetNum)
        global.authorizedUsers.add(target)
        return sock.sendMessage(from, { text: `✅ تم اضافة @${targetNum}`, mentions: [target] }, { quoted: msg })
      }

      // امسح فرعي
      if (matchCommand(text, COMMANDS.removeSubBot)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        const target = getMentioned(msg)
        if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن' }, { quoted: msg })
        const targetNum = target.split('@')[0].split(':')[0]
        global.authorizedUsers.delete(targetNum)
        global.authorizedUsers.delete(target)
        return sock.sendMessage(from, { text: `✅ تم مسح @${targetNum}`, mentions: [target] }, { quoted: msg })
      }

      // البوتات
      if (matchCommand(text, COMMANDS.bots)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        if (activeBots.size === 0) return sock.sendMessage(from, { text: '📭 مفيش بوتات' }, { quoted: msg })
        let list = '📋 البوتات:\n\n'
        let i = 1
        for (const [num] of activeBots) { list += `${i}. ${num}\n`; i++ }
        return sock.sendMessage(from, { text: list }, { quoted: msg })
      }

      // الغاء
      if (matchCommand(text, COMMANDS.cancel)) {
        if (!isOwner) return sock.sendMessage(from, { text: NOT_OWNER_MSG }, { quoted: msg })
        pendingCodes.delete(from)
        return sock.sendMessage(from, { text: '✅ تم الإلغاء' }, { quoted: msg })
      }

      // قول
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

  console.log(`\n🔧 إنشاء بوت فرعي: ${phoneNumber}`)

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

  subSock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(`⚠️ بوت ${phoneNumber} انقطع: ${reason}`)

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
      console.log(`✅ بوت فرعي اتصل: ${phoneNumber}`)
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
      console.log(`🔑 طلب كود لـ ${phoneNumber}...`)

      const lastSub = global.subBotCooldown.get(phoneNumber) || 0
      if (Date.now() - lastSub < 50000) {
        console.log(`⏳ ${phoneNumber} في cooldown`)
        return
      }
      global.subBotCooldown.set(phoneNumber, Date.now())

      const code = await subSock.requestPairingCode(phoneNumber)
      const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code
      console.log(`✅ كود ${phoneNumber}: ${formattedCode}`)

      await mainSock.sendMessage(requesterJid, {
        text: `╭━━━ ⚡ *${BOT_NAME}* ⚡ ━━━╮
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
      await mainSock.sendMessage(requesterJid, {
        text: `❌ *فشل إنشاء الكود*\n\n⚠️ جرب تاني بعد 15 دقيقة`
      }).catch(() => {})
    }
  }, 10000)
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
