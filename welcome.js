// ═══════════════════════════════════════════════════════
// 👋 نظام الترحيب والمغادرة - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

const welcomeImage = 'https://file.garden/aauvg01sjleV_ic1/2B.webp'
const goodbyeImage = 'https://file.garden/aauvg01sjleV_ic1/8d6c229e6d9f3cf2b9fa209b08625266.jpg'
const audioUrl = 'https://file.garden/aauvg01sjleV_ic1/%D8%AA%D8%B1%D8%AD%D9%8A%D8%A8.opus'

// ═══════════════════════════════════════════════════════
// ✅ أمر تفعيل/تعطيل الترحيب
// ═══════════════════════════════════════════════════════
export async function handleWelcomeCommand(sock, msg, from, cmd, chat) {
  const args = cmd.split(' ').slice(1)
  const type = (args[0] || '').toLowerCase()
  const enable = cmd.startsWith('on')

  if (type !== 'welcome' && type !== 'ترحيب') {
    return sock.sendMessage(from, {
      text: `╭━━ 🌟 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ━━⃝💙
│
│ 🔹 *.on welcome* — تفعيل الترحيب
│ 🔹 *.off welcome* — تعطيل الترحيب
│
╰━━━━━━━━━━━━━⃝💙`
    }, { quoted: msg })
  }

  chat.welcome = enable
  return sock.sendMessage(from, {
    text: `╭━━ ⚡ *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ⚡ ━━╮
│
│ ${enable ? '✅ تم تفعيل الترحيب' : '❌ تم تعطيل الترحيب'}
│
╰━━━━━━━━━━━━━╯`
  }, { quoted: msg })
}

// ═══════════════════════════════════════════════════════
// ✅ معالجة دخول وخروج الأعضاء
// ═══════════════════════════════════════════════════════
export async function handleWelcomeEvent(sock, event) {
  const { id, participants, action } = event
  if (!id || !participants) return

  const chat = global.db?.data?.chats?.[id]
  if (!chat?.welcome) return

  let groupMetadata, groupSize, groupDescription
  try {
    groupMetadata = await sock.groupMetadata(id)
    groupSize = groupMetadata.participants.length
    groupDescription = groupMetadata.desc || 'لا يوجد وصف متاح'
  } catch (e) {
    console.error('[𝑫𝑨𝑹𝑲] Error:', e.message)
    return
  }

  for (const participant of participants) {
    const userId = typeof participant === 'string' ? participant : participant.id || participant.jid
    if (!userId) continue

    let userName = 'عضو'
    try {
      userName = await sock.getName(userId) || 'عضو'
      if (userName.match(/^\d+$/)) userName = 'عضو'
    } catch {}

    const userMention = '@' + userId.split('@')[0]

    // ═══ ترحيب ═══
    if (action === 'add') {
      const txtWelcome = `╭━━ 👋 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ━━⃝💙
│
│ ✨ *أهلاً وسهلاً بيك* ✨
│
│ 👤 *العضو:* ${userMention}
│ 📍 *المجموعة:* ${groupMetadata.subject}
│ 👥 *الأعضاء:* ${groupSize}
│
│ 📝 *الوصف:*
│ ${groupDescription.substring(0, 100)}
│
│ 💙 *نورت الجروب يا ${userMention}*
│
╰━━━━━ 𝑫𝑨𝑹𝑲 ━━━━━╯`

      try {
        await sock.sendMessage(id, {
          image: { url: welcomeImage },
          caption: txtWelcome,
          mentions: [userId]
        })

        await sock.sendMessage(id, {
          audio: { url: audioUrl },
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        })
      } catch (e) {
        console.error('[𝑫𝑨𝑹𝑲] Error sending welcome:', e.message)
      }
    }

    // ═══ مغادرة ═══
    if (action === 'remove') {
      const txtBye = `╭━━ 😢 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲* ━━⃝💙
│
│ 👤 *العضو:* ${userMention}
│ 📍 *المجموعة:* ${groupMetadata.subject}
│ 👥 *الأعضاء:* ${groupSize}
│
│ 💔 *وداعاً يا ${userMention}*
│ *نتمنى رؤيتك مرة أخرى*
│
╰━━━━━ 𝑫𝑨𝑹𝑲 ━━━━━╯`

      try {
        await sock.sendMessage(id, {
          image: { url: goodbyeImage },
          caption: txtBye,
          mentions: [userId]
        })
      } catch (e) {
        console.error('[𝑫𝑨𝑹𝑲] Error sending goodbye:', e.message)
      }
    }
  }
}
