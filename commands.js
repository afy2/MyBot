// ═══════════════════════════════════════════════════════
// 📋 أوامر 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

import { WELCOME_IMAGE, GOODBYE_IMAGE, WELCOME_AUDIO, BOT_IMAGES, getRandomImage } from './config.js'

export const NOT_OWNER_MSG = `بس. ي حبيــــᬼٰٰٰٰٖٖـ͜ــــبي لما تكـ̮ـــ͢ـ̸̐ـــــ̮بر ابقا افتـــ᭄ـ͜ـــحو🛀🏽🍷┊𖤐𓈒𓏲\n𝑫𝑨𝑹𝑲ᬽ🙄🍷┊𖤐𓈒𓏲`

export const COMMANDS = {
  ping: ['ping', 'بينج', 'اختبار'],
  menu: ['menu', 'قائمة', 'الاوامر', 'الأوامر', 'help', 'مساعدة', 'اوامر', 'شرح'],
  owner_menu: ['اونر', 'owner menu', 'اوامر المالك'],
  admin_menu: ['ادمن', 'admin', 'اوامر الادارة', 'اوامر الإدارة'],
  owner: ['owner', 'المالك', 'المطور', 'صاحب'],
  time: ['time', 'الوقت', 'الساعة'],
  info: ['info', 'معلومات'],
  install: ['تنصيب', 'install'],
  test: ['تست', 'test'],
  bots: ['البوتات', 'bots'],

  kick: ['اطرد', 'kick'],
  promote: ['ارفع', 'promote'],
  demote: ['نزل', 'demote'],
  mute: ['اسكت', 'mute'],
  unmute: ['اتكلم', 'unmute'],
  tagall: ['تاك', 'tagall'],
  groupLink: ['لينك', 'link'],
  revoke: ['تصفير', 'revoke'],
  groupInfo: ['معلومات الجروب'],

  say: ['say', 'قول'],
  cancel: ['الغاء'],
  openInstall: ['فتح تنصيب', 'open install'],
  closeInstall: ['قفل تنصيب', 'close install'],

  onWelcome: ['on welcome', 'تفعيل الترحيب'],
  offWelcome: ['off welcome', 'تعطيل الترحيب'],

  mute_member: ['كتم'],
  unmute_member: ['فك كتم'],
  mutedList: ['المكتومين', 'muted'],

  addSubBot: ['اضف فرعي'],
  removeSubBot: ['امسح فرعي'],
  subBotsList: ['الفروع', 'subbots'],

  enableAntilink: ['تفعيل منع الروابط', 'on antilink'],
  disableAntilink: ['ايقاف منع الروابط', 'off antilink'],
  antilink: ['منع الروابط', 'antilink'],
  enableAntibad: ['تفعيل منع الشتائم', 'on antibad'],
  disableAntibad: ['ايقاف منع الشتائم', 'off antibad'],
  antibad: ['منع الشتائم', 'antibad'],
  enableAntiviewonce: ['تفعيل منع الاستوري', 'on antiviewonce'],
  disableAntiviewonce: ['ايقاف منع الاستوري', 'off antiviewonce'],
  antiviewonce: ['منع الاستوري', 'antiviewonce'],
  activationMenu: ['تفعيل', 'activation'],

  xo: ['اكس او', 'xo', 'اكس'],
  guess: ['تخمين', 'guess'],
  rps: ['حجر ورقة مقص', 'rps', 'حجر'],
  dice: ['نرد', 'dice'],

  ai: ['ذكاء', 'ai', 'اسأل'],
  image: ['صوره', 'image', 'img'],

  decorate: ['زخرفة', 'decorate'],
  reverse: ['عكس', 'reverse'],
  calc: ['حاسبة', 'calc', 'احسب'],
  quote: ['اقتباس', 'quote'],
  joke: ['نكتة', 'joke', 'نكته'],
  fact: ['هل تعلم', 'fact'],

  expose: ['فضح', 'expose'],

  clear: ['مسح', 'clear'],
  clearAll: ['مسح الكل', 'clearall'],

  play: ['تشغيل', 'play', 'شغل'],
  search: ['بحث', 'search', 'يبحث'],

  buttonsMenu: ['ازرار', 'buttons']
}

export function matchCommand(text, keywords) {
  if (!keywords || !Array.isArray(keywords)) return false
  const clean = text.replace(/^[.\/!#*]/, '').trim().toLowerCase()
  return keywords.some(k => clean === k.toLowerCase())
}

export function buildMenu(userName = 'مستخدم', uptime = '00:00:00', time = '') {
  return `🔸 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* 🔸
━━━━━━━━━━━━━━━

👤 *المستخدم:* @${userName}
⚙️ *التشغيل:* ${uptime}
🕐 *الوقت:* ${time}

━━━━━━━━━━━━━━━

📋 *اختر من القائمة:*

🔹 الأوامر العامة
🔹 أوامر الإدارة
🔹 أوامر المالك
🔹 الألعاب
🔹 الأدوات

━━━━━━━━━━━━━━━
𝑩𝑶𝑻 𝑫𝑨𝑹𝑲 © 2026`
}

export function getSectionContent(id) {
  const sections = {
    admin: `╭━━━ 🛡️ *أوامر الإدارة* 🛡️ ━━━╮
┃
┃ 🔹 اطرد @عضو
┃ 🔹 ارفع @عضو
┃ 🔹 نزل @عضو
┃ 🔹 اسكت
┃ 🔹 اتكلم
┃ 🔹 تاك
┃ 🔹 لينك
┃ 🔹 تصفير
┃ 🔹 معلومات الجروب
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🤐 *الكتم* ━━━╮
┃
┃ 🔹 كتم @عضو
┃ 🔹 فك كتم @عضو
┃ 🔹 المكتومين
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🛡️ *الحماية* ━━━╮
┃
┃ 🔹 منع الروابط
┃ 🔹 منع الشتائم
┃ 🔹 منع الاستوري
┃
╰━━━━━━━━━━━━━━━╯`,

    owner: `╭━━━ 👑 *أوامر المالك* 👑 ━━━╮
┃
┃ 🔹 البوتات
┃ 🔹 قول [نص]
┃ 🔹 فتح تنصيب
┃ 🔹 قفل تنصيب
┃ 🔹 الغاء
┃ 🔹 اضف فرعي @عضو
┃ 🔹 امسح فرعي @عضو
┃ 🔹 الفروع
┃
╰━━━━━━━━━━━━━━━╯`
  }
  return sections[id] || '❌ قسم غير موجود'
}

export async function handleWelcome(sock, event, db) {
  const { id, participants, action } = event
  if (!id || !participants) return

  const chat = db.data.chats[id]
  if (!chat?.welcome) return

  let meta, size
  try {
    meta = await sock.groupMetadata(id)
    size = meta.participants.length
  } catch (e) { return }

  for (const p of participants) {
    const uid = typeof p === 'string' ? p : p.id || p.jid
    if (!uid) continue
    const mention = '@' + uid.split('@')[0]

    if (action === 'add') {
      const txt = `╭━━ 👋 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ━━╮
│
│ ✨ *أهلاً وسهلاً* ✨
│
│ 👤 *العضو:* ${mention}
│ 📍 *المجموعة:* ${meta.subject}
│ 👥 *الأعضاء:* ${size}
│
│ 💙 *نورت الجروب*
│
╰━━━━━ 𝑫𝑨𝑹𝑲 ━━━━━╯`

      try {
        await sock.sendMessage(id, {
          image: { url: WELCOME_IMAGE },
          caption: txt,
          mentions: [uid]
        })
        await sock.sendMessage(id, {
          audio: { url: WELCOME_AUDIO },
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        })
      } catch (e) {}
    }

    if (action === 'remove') {
      const txt = `╭━━ 😢 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ━━╮
│
│ 👤 *العضو:* ${mention}
│ 📍 *المجموعة:* ${meta.subject}
│ 👥 *الأعضاء:* ${size}
│
│ 💔 *نتمنى رجوعك*
│
╰━━━━━ 𝑫𝑨𝑹𝑲 ━━━━━╯`

      try {
        await sock.sendMessage(id, {
          image: { url: GOODBYE_IMAGE },
          caption: txt,
          mentions: [uid]
        })
      } catch (e) {}
    }
  }
}

export async function handleWelcomeToggle(sock, from, msg, enable, db) {
  if (!db.data.chats[from]) db.data.chats[from] = {}
  db.data.chats[from].welcome = enable
  await sock.sendMessage(from, {
    text: enable ? '✅ تم تفعيل الترحيب' : '❌ تم تعطيل الترحيب'
  }, { quoted: msg })
}

export function getAnimeImage(category = 'waifu') {
  if (BOT_IMAGES && BOT_IMAGES.length > 0) {
    return getRandomImage()
  }
  return null
}
