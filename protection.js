// ═══════════════════════════════════════════════════════
// 🛡️ الحماية - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

const BAD_WORDS = [
    'يشرموط', 'يمتناك', 'كسمك', 'يبن زنيه', 'عرص', 'خول', 'امك فاجره',
  'كلب', 'حمار', 'غبي', 'خنزير', 'زبالة', 'قذر', 'خرا', 'زبال',
  'شرموط', 'عرص', 'قحبة', 'منيوك', 'خول', 'ديوث',
  'يلبوه', 'يليو', 'يبن شرموطه', 'زبي', 'كسك', 'علق',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'cunt',
  'idiot', 'stupid', 'moron', 'bastard'
]

const LINK_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)|(wa\.me\/[^\s]+)/gi

export async function checkMessage(sock, msg, from, isGroup, isOwner, isUserAdmin, chat) {
  if (!isGroup || isOwner || isUserAdmin) return false

  const text = (msg.message?.conversation
    || msg.message?.extendedTextMessage?.text
    || msg.message?.imageMessage?.caption
    || msg.message?.videoMessage?.caption
    || '').toLowerCase()

  if (!text) return false

  if (chat.antilink) {
    LINK_REGEX.lastIndex = 0
    if (LINK_REGEX.test(text)) {
      await sock.sendMessage(from, { delete: msg.key }).catch(() => {})
      await sock.sendMessage(from, {
        text: `🚫 *يــ۬ۦٕ٘۬ 𖥡ﹻٰ۬ۛۛـبت مٓࢪآتــــ꙰◌ــــي مٓــۥـ℘ـۥــسمٓعش صؤتــ๋͜ﮧـ͜ާـٌـك🤤​​​​​​​​💗┊𖤐𓈒𓏲*\n\n👤 @${msg.key.participant?.split('@')[0] || msg.key.remoteJid.split('@')[0]}`,
        mentions: [msg.key.participant || msg.key.remoteJid]
      })
      return true
    }
  }

  if (chat.antibad) {
    const foundBad = BAD_WORDS.find(w => text.includes(w))
    if (foundBad) {
      await sock.sendMessage(from, { delete: msg.key }).catch(() => {})
      await sock.sendMessage(from, {
        text: `🚫 *هتــــ๋͜࿇ــــتمٓ تآني 𝑫𝑨𝑹𝑲 هيــ۬ۦٕ٘۬ 𖥡ﹻٰ۬ۛۛـنك تلآته كسـﹻ۬ﹻۧ۬ﹻٰ۬ﹻ۬ﹻـمٓك🙄🍷┊𖤐𓈒𓏲*\n\n👤 @${msg.key.participant?.split('@')[0] || msg.key.remoteJid.split('@')[0]}`,
        mentions: [msg.key.participant || msg.key.remoteJid]
      })
      return true
    }
  }

  if (chat.antiviewonce) {
    const isViewOnce = msg.message?.viewOnceMessage
      || msg.message?.viewOnceMessageV2
      || msg.message?.imageMessage?.viewOnce
      || msg.message?.videoMessage?.viewOnce

    if (isViewOnce) {
      await sock.sendMessage(from, { delete: msg.key }).catch(() => {})
      await sock.sendMessage(from, {
        text: ` *متـــ᭄ـ͜ـــتمنـ̐ــ̐͢ـ͓ـ̐ــ̐ـ͢ـ͓̐ـــظرش وعمك⃟ دارك مــــ๋͜࿇ــــوجود👑🍷┊𖤐𓈒𓏲*\n\n👤 @${msg.key.participant?.split('@')[0] || msg.key.remoteJid.split('@')[0]}`,
        mentions: [msg.key.participant || msg.key.remoteJid]
      })
      return true
    }
  }

  return false
}

export async function toggleProtection(sock, from, msg, chat, db, type, enable) {
  if (!db.data.chats[from]) db.data.chats[from] = {}
  db.data.chats[from][type] = enable

  const names = {
    antilink: '🚫 منع الروابط',
    antibad: '🤬 منع الشتائم',
    antiviewonce: '📸 منع الاستوري'
  }

  await sock.sendMessage(from, {
    text: `${names[type]} ${enable ? '✅ *تم التفعيل*' : '❌ *تم التعطيل*'}`
  }, { quoted: msg })
}

export async function toggleAllProtection(sock, from, msg, db, enable) {
  if (!db.data.chats[from]) db.data.chats[from] = {}
  db.data.chats[from].antilink = enable
  db.data.chats[from].antibad = enable
  db.data.chats[from].antiviewonce = enable
  await sock.sendMessage(from, {
    text: enable ? `✅ *تم تفعيل الحماية الكاملة*` : `❌ *تم تعطيل الحماية الكاملة*`
  }, { quoted: msg })
}
