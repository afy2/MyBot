// ═══════════════════════════════════════════════════════
// 🎭 الفضح - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

import { downloadContentFromMessage } from '@whiskeysockets/baileys'

// ✅ فضح — يبعت الميديا اللي رديت عليها
export async function exposeMedia(sock, from, msg, senderJid) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

  if (!quoted) {
    return sock.sendMessage(from, {
      text: `🎭 *يمفضوخ*\n\n📌 الطريقة:\n• رد على صورة / فيديو / فويس\n• اكتب: فضح`
    }, { quoted: msg })
  }

  const participant = msg.message?.extendedTextMessage?.contextInfo?.participant
  if (!participant) {
    return sock.sendMessage(from, { text: '❌ مفيش حد مذكور' }, { quoted: msg })
  }

  const mention = `@${participant.split('@')[0]}`

  try {
    // ✅ صورة
    if (quoted.imageMessage) {
      const stream = await downloadContentFromMessage(quoted.imageMessage, 'image')
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

      return sock.sendMessage(from, {
        image: buffer,
        caption: `🎭 *المفضوح* ${mention}\n\n📸 خدوا شوفوا الصورة دي 😂`,
        mentions: [participant]
      })
    }

    // ✅ فيديو
    if (quoted.videoMessage) {
      const stream = await downloadContentFromMessage(quoted.videoMessage, 'video')
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

      return sock.sendMessage(from, {
        video: buffer,
        caption: `🎭 *المفضوح* ${mention}\n\n📹 خدوا شوفوا الفيديو ده 😂`,
        mentions: [participant]
      })
    }

    // ✅ فويس
    if (quoted.audioMessage) {
      const stream = await downloadContentFromMessage(quoted.audioMessage, 'audio')
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

      return sock.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mp4',
        ptt: true
      }, { quoted: msg })
    }

    // ✅ ملصق
    if (quoted.stickerMessage) {
      const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker')
      let buffer = Buffer.from([])
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

      return sock.sendMessage(from, {
        sticker: buffer
      }, { quoted: msg })
    }

    return sock.sendMessage(from, {
      text: '❌ نوع الميديا ده مش مدعوم'
    }, { quoted: msg })

  } catch (err) {
    console.log('❌ Expose Error:', err.message)
    return sock.sendMessage(from, {
      text: `❌ *فشل الفضح*\n\nجرب تاني`
    }, { quoted: msg })
  }
}
