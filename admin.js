// ═══════════════════════════════════════════════════════
// 🛡️ إدارة الجروبات - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

export async function isAdmin(sock, chatId, userId) {
  try {
    const meta = await sock.groupMetadata(chatId)
    const userNum = userId.split('@')[0].split(':')[0]
    const participant = meta.participants.find(p => {
      const pNum = p.id.split('@')[0].split(':')[0]
      return p.id === userId || pNum === userNum
    })
    return participant?.admin === 'admin' || participant?.admin === 'superadmin'
  } catch (e) { return false }
}

export async function isBotAdmin(sock, chatId) {
  try {
    const meta = await sock.groupMetadata(chatId)
    const botJid = sock.user.id || ''
    const botLid = sock.user.lid || ''
    const botIdentifiers = [
      botJid, botLid,
      botJid.split(':')[0] + '@s.whatsapp.net',
      botLid.split(':')[0] + '@lid',
      botJid.split('@')[0].split(':')[0],
      botLid.split('@')[0].split(':')[0]
    ].filter(Boolean)

    for (const p of meta.participants) {
      const pId = p.id || ''
      const pNum = pId.split('@')[0].split(':')[0]
      if (botIdentifiers.some(id => id === pId || id === pNum)) {
        if (p.admin === 'admin' || p.admin === 'superadmin') return true
      }
    }
    return false
  } catch (e) { return false }
}

export function getMentioned(msg) {
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  if (mentions[0]) return mentions[0]
  const replied = msg.message?.extendedTextMessage?.contextInfo?.participant
  if (replied) return replied
  return null
}

export async function kickMember(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن للعضو' }, { quoted: msg })
  try {
    await sock.groupParticipantsUpdate(from, [target], 'remove')
    await sock.sendMessage(from, { text: `✅ *تم طرد* @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message }, { quoted: msg })
  }
}

export async function promoteMember(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن للعضو' }, { quoted: msg })
  try {
    await sock.groupParticipantsUpdate(from, [target], 'promote')
    await sock.sendMessage(from, { text: `👑 *تم رفع* @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message }, { quoted: msg })
  }
}

export async function demoteMember(sock, from, msg, target) {
  if (!target) return sock.sendMessage(from, { text: '❌ اعمل منشن للعضو' }, { quoted: msg })
  try {
    await sock.groupParticipantsUpdate(from, [target], 'demote')
    await sock.sendMessage(from, { text: `⬇️ *تم تنزيل* @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message }, { quoted: msg })
  }
}

export async function muteGroup(sock, from, msg) {
  try {
    await sock.groupSettingUpdate(from, 'announcement')
    await sock.sendMessage(from, { text: '🔒 *تم قفل الجروب*' }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message }, { quoted: msg })
  }
}

export async function unmuteGroup(sock, from, msg) {
  try {
    await sock.groupSettingUpdate(from, 'not_announcement')
    await sock.sendMessage(from, { text: '🔓 *تم فتح الجروب*' }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message }, { quoted: msg })
  }
}

export async function tagAll(sock, from, msg, text) {
  try {
    const meta = await sock.groupMetadata(from)
    const mentions = meta.participants.map(p => p.id)
    let tagText = `📢 *تنبيه للجميع*\n\n${text || ''}\n\n`
    tagText += mentions.map(m => `@${m.split('@')[0]}`).join(' ')
    await sock.sendMessage(from, { text: tagText, mentions }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل: ' + e.message }, { quoted: msg })
  }
}

export async function getGroupLink(sock, from, msg) {
  try {
    const code = await sock.groupInviteCode(from)
    await sock.sendMessage(from, { text: `🔗 *رابط الجروب:*\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل' }, { quoted: msg })
  }
}

export async function revokeLink(sock, from, msg) {
  try {
    await sock.groupRevokeInvite(from)
    await sock.sendMessage(from, { text: '✅ *تم تصفير الرابط*' }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل' }, { quoted: msg })
  }
}

export async function groupInfo(sock, from, msg) {
  try {
    const meta = await sock.groupMetadata(from)
    const admins = meta.participants.filter(p => p.admin)
    const created = new Date(meta.creation * 1000).toLocaleDateString('ar-EG')
    const text = `╭━━━ 📋 *معلومات الجروب* ━━━╮\n┃\n┃ 📛 *الاسم:* ${meta.subject}\n┃ 👥 *الأعضاء:* ${meta.participants.length}\n┃ 👑 *المشرفين:* ${admins.length}\n┃ 📅 *الإنشاء:* ${created}\n┃ 📝 *الوصف:* ${meta.desc || 'لا يوجد'}\n┃\n╰━━━━━━━━━━━━━━━╯`
    await sock.sendMessage(from, { text }, { quoted: msg })
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ فشل' }, { quoted: msg })
  }
}
