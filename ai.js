// ═══════════════════════════════════════════════════════
// 🤖 الذكاء الاصطناعي - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

import axios from 'axios'
import { OWNER_NAME } from './config.js'

export async function askAI(sock, from, msg, question) {
  if (!question || question.trim().length < 2) {
    return sock.sendMessage(from, { text: `🤖 *الذكاء الاصطناعي*\n\n📌 اكتب: ذكاء [سؤالك]` }, { quoted: msg })
  }

  try {
    await sock.sendMessage(from, { text: '🤔 *جاري التفكير...*' }, { quoted: msg })

    const url = `https://text.pollinations.ai/${encodeURIComponent(question)}?model=openai`

    const res = await axios.get(url, { timeout: 30000 })
    const answer = res.data

    if (!answer || answer.trim().length === 0) {
      return sock.sendMessage(from, { text: '❌ *مفيش رد*' }, { quoted: msg })
    }

    const final = answer.length > 4000 ? answer.substring(0, 4000) + '...' : answer
    await sock.sendMessage(from, {
      text: `🤖 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲 AI*\n━━━━━━━━━━━━━━━\n\n${final}\n\n━━━━━━━━━━━━━━━\n👑 ${OWNER_NAME}`
    }, { quoted: msg })

  } catch (err) {
    console.log('❌ AI Error:', err.message)
    await sock.sendMessage(from, { text: `❌ *الذكاء الاصطناعي مش متاح*\n\nجرب تاني` }, { quoted: msg })
  }
}

export async function generateImage(sock, from, msg, prompt) {
  if (!prompt || prompt.trim().length < 2) {
    return sock.sendMessage(from, { text: `🎨 *توليد صور*\n\n📌 اكتب: صوره [وصف]` }, { quoted: msg })
  }

  try {
    await sock.sendMessage(from, { text: '🎨 *جاري رسم الصورة...*' }, { quoted: msg })

    const encoded = encodeURIComponent(prompt)
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`

    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000
    })

    const imageBuffer = Buffer.from(res.data)

    await sock.sendMessage(from, {
      image: imageBuffer,
      caption: `🎨 *${prompt}*\n\n🤖 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲 AI`
    }, { quoted: msg })

  } catch (err) {
    console.log('❌ Image Error:', err.message)
    await sock.sendMessage(from, { text: `❌ *فشل توليد الصورة*\n\nجرب تاني` }, { quoted: msg })
  }
}
