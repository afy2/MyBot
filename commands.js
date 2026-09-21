// ═══════════════════════════════════════════════════════
// 📋 أوامر 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

import { WELCOME_IMAGE, GOODBYE_IMAGE, WELCOME_AUDIO, BOT_IMAGES, getRandomImage } from './config.js'

export const NOT_OWNER_MSG = `بس. ي حبيــــᬼٰٰٰٰٖٖـ͜ــــبي لما تكـ̮ـــ͢ـ̸̐ـــــ̮بر ابقا افتـــ᭄ـ͜ـــحو🛀🏽🍷┊𖤐𓈒𓏲\n𝑫𝑨𝑹𝑲ᬽ🙄🍷┊𖤐𓈒𓏲`

export const COMMANDS = {
  // ✅ عامة
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

  // ✅ إدارة
  kick: ['طرد', 'kick'],
  promote: ['ارفع', 'promote'],
  demote: ['نزل', 'demote'],
  mute: ['اسكت', 'mute', 'اكتمو','اخرسو' ],
  unmute: ['اتكلم', 'unmute'],
  tagall: ['تاك', 'tagall'],
  groupLink: ['لينك', 'link'],
  revoke: ['تصفير', 'revoke'],
  groupInfo: ['معلومات الجروب'],
  profile: ['بروفايل', 'profile', 'معلومات'],
  // ✅ المالك
  say: ['say', 'قول'],
  cancel: ['الغاء'],
  openInstall: ['فتح تنصيب', 'open install'],
  closeInstall: ['قفل تنصيب', 'close install'],

  // ✅ ترحيب
  onWelcome: ['on welcome', 'تفعيل الترحيب'],
  offWelcome: ['off welcome', 'تعطيل الترحيب'],

  // ✅ كتم
  mute_member: ['كتم', 'صدعتني'],
  unmute_member: ['فك كتم','فكو', 'فك', 'اتكلم'],
  mutedList: ['المكتومين', 'muted'],

  // ✅ فروع
  addSubBot: ['اضف فرعي'],
  removeSubBot: ['امسح فرعي'],
  subBotsList: ['الفروع', 'subbots'],

  // ✅ حماية
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

  // ✅ ألعاب
  xo: ['اكس او', 'xo', 'اكس'],
  guess: ['تخمين', 'guess'],
  rps: ['حجر ورقة مقص', 'rps', 'حجر'],
  dice: ['نرد', 'dice'],

  // ✅ ذكاء
  ai: ['ذكاء', 'ai', 'اسأل'],
  image: ['صوره', 'image', 'img'],

  // ✅ أدوات
  decorate: ['زخرفة', 'decorate'],
  reverse: ['عكس', 'reverse'],
  calc: ['حاسبة', 'calc', 'احسب'],
  quote: ['اقتباس', 'quote'],
  joke: ['نكتة', 'joke', 'نكته'],
  fact: ['هل تعلم', 'fact'],

  // ✅ فضح
  expose: ['فضح', 'expose'],

  // ✅ مسح
  clear: ['مسح', 'clear'],
  clearAll: ['مسح الكل', 'clearall'],

  // ✅ مشغل
  play: ['تشغيل', 'play', 'شغل'],
  search: ['بحث', 'search', 'يبحث']
}

export function matchCommand(text, keywords) {
  if (!keywords || !Array.isArray(keywords)) return false
  const clean = text.replace(/^[.\/!#*]/, '').trim().toLowerCase()
  return keywords.some(k => clean === k.toLowerCase())
}

// ═══════════════════════════════════════════════════════
// 📋 القائمة الرئيسية
// ═══════════════════════════════════════════════════════
export function buildMenu(userName = 'مستخدم', uptime = '00:00:00', time = '') {
  return `🔸 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* 🔸
━━━━━━━━━━━━━━━

👤 *المستخدم:* @${userName}
⚙️ *التشغيل:* ${uptime}
🕐 *الوقت:* ${time}

━━━━━━━━━━━━━━━

📋 *الأوامر المتاحة:*

🔹 *اوامر* — أوامر عامة
🔹 *ادمن* — أوامر الإدارة
🔹 *اونر* — أوامر المالك

━━━━━━━━━━━━━━━
𝑩𝑶𝑻 𝑫𝑨𝑹𝑲 © 2026`
}

// ═══════════════════════════════════════════════════════
// 📋 الأقسام
// ═══════════════════════════════════════════════════════
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

╭━━━ 🎭 *الفضح* ━━━╮
┃
┃ 🔹 فضح (رد على ميديا)
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🛡️ *الحماية* ━━━╮
┃
┃ 🔹 منع الروابط (تبديل)
┃ 🔹 منع الشتائم (تبديل)
┃ 🔹 منع الاستوري (تبديل)
┃
┃ 🔹 تفعيل منع الروابط
┃ 🔹 ايقاف منع الروابط
┃ 🔹 تفعيل منع الشتائم
┃ 🔹 ايقاف منع الشتائم
┃ 🔹 تفعيل منع الاستوري
┃ 🔹 ايقاف منع الاستوري
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 👋 *الترحيب* ━━━╮
┃
┃ 🔹 تفعيل الترحيب
┃ 🔹 تعطيل الترحيب
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🗑️ *المسح* ━━━╮
┃
┃ 🔹 مسح (رد على رسالة)
┃ 🔹 مسح الكل
┃
╰━━━━━━━━━━━━━━━╯`,

    owner: `╭━━━ 👑 *أوامر المالك* 👑 ━━━╮
┃
┃ 🔹 البوتات
┃ 🔹 قول [نص]
┃ 🔹 فتح تنصيب
┃ 🔹 قفل تنصيب
┃ 🔹 الغاء
┃
╰━━━━━━━━━━━━━━━╯

╭━━━ 🔧 *إدارة الفروع* ━━━╮
┃
┃ 🔹 اضف فرعي @عضو
┃ 🔹 امسح فرعي @عضو
┃ 🔹 الفروع
┃
╰━━━━━━━━━━━━━━━╯`
  }
  return sections[id] || '❌ قسم غير موجود'
}

// ═══════════════════════════════════════════════════════
// 👋 الترحيب
// ═══════════════════════════════════════════════════════
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

// ✅ جلب صورة عشوائية
export function getAnimeImage(category = 'waifu') {
  if (BOT_IMAGES && BOT_IMAGES.length > 0) {
    return getRandomImage()
  }
  return null
}
