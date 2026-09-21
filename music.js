// ═══════════════════════════════════════════════════════
// 🎵 المشغل - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲 (yt-dlp)
// ═══════════════════════════════════════════════════════

import yts from 'yt-search'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync = promisify(exec)

export async function playMusic(sock, from, msg, query) {
  if (!query || query.trim().length < 2) {
    return sock.sendMessage(from, { text: `🎵 *المشغل*\n\n📌 اكتب: تشغيل [اسم أغنية]` }, { quoted: msg })
  }

  try {
    await sock.sendMessage(from, { text: `🔍 *جاري البحث:* ${query}...` }, { quoted: msg })

    const result = await yts(query)
    const video = result.videos[0]
    if (!video) return sock.sendMessage(from, { text: '❌ مفيش نتايج' }, { quoted: msg })

    await sock.sendMessage(from, {
      text: `🎵 *لقيت:*\n📌 ${video.title}\n⏱️ ${video.timestamp}\n\n⏳ جاري التحميل...`
    }, { quoted: msg })

    const tmpDir = '/data/data/com.termux/files/home/MyBot/tmp'
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

    const id = Date.now()
    const outputTemplate = `${tmpDir}/${id}.%(ext)s`

    await execAsync(
      `yt-dlp -x --audio-format mp3 --audio-quality 128K -o "${outputTemplate}" "${video.url}"`,
      { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }
    )

    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(`${id}.`))
    if (files.length === 0) throw new Error('الملف مش موجود')

    const audioPath = `${tmpDir}/${files[0]}`

    await sock.sendMessage(from, {
      audio: fs.readFileSync(audioPath),
      mimetype: 'audio/mp4',
      ptt: false,
      fileName: `${video.title}.mp3`
    }, { quoted: msg })

    try { fs.unlinkSync(audioPath) } catch (e) {}

  } catch (err) {
    console.log('❌ Music Error:', err.message)
    await sock.sendMessage(from, { text: `❌ *فشل التحميل*\n\nجرب تاني بعد شوية` }, { quoted: msg })
  }
}

export async function searchMusic(sock, from, msg, query) {
  if (!query || query.trim().length < 2) {
    return sock.sendMessage(from, { text: `🔍 *البحث*\n\n📌 اكتب: بحث [كلمة]` }, { quoted: msg })
  }

  try {
    const result = await yts(query)
    const videos = result.videos.slice(0, 5)

    if (videos.length === 0) {
      return sock.sendMessage(from, { text: '❌ مفيش نتايج' }, { quoted: msg })
    }

    let text = `🔍 *نتايج البحث:*\n\n`
    videos.forEach((v, i) => {
      text += `${i + 1}. *${v.title}*\n`
      text += `   ⏱️ ${v.timestamp} | 👤 ${v.author.name}\n\n`
    })

    await sock.sendMessage(from, { text }, { quoted: msg })

  } catch (err) {
    console.log('❌ Search Error:', err.message)
    await sock.sendMessage(from, { text: `❌ *فشل البحث*` }, { quoted: msg })
  }
}
