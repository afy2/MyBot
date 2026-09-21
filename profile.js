// ═══════════════════════════════════════════════════════
// 👤 سحب بروفايل - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

export async function getProfile(sock, from, msg, target) {
  if (!target) {
    return sock.sendMessage(from, { text: '❌ اعمل منشن للعضو أو رد على رسالته' }, { quoted: msg })
  }

  try {
    const number = target.split('@')[0].split(':')[0]

    let profilePic = null
    try {
      profilePic = await sock.profilePictureUrl(target, 'image')
    } catch (e) {
      profilePic = null
    }

    let name = 'غير معروف'
    try {
      name = await sock.getName(target) || 'غير معروف'
    } catch (e) {}

    let status = 'مش متاح'
    try {
      const st = await sock.fetchStatus(target)
      status = st?.status || 'مش متاح'
    } catch (e) {}

    const text = `╭━━━ 👤 *معلومات البروفايل* ━━━╮
┃
┃  🐤 *اسمك ي برو:* ${name}
┃     😍*نمبرك:* +${number}
┃ ❤️‍🩹 *حلتم وكد:* ${status}
┃🆔*يور اي دييي:* @${number}
┃
╰━━━━━━━━━━━━━━━╯

🤖 *𝑩𝑶𝑻 𝑫𝑨𝑹𝑲*`

    if (profilePic) {
      await sock.sendMessage(from, {
        image: { url: profilePic },
        caption: text,
        mentions: [target]
      }, { quoted: msg })
    } else {
      await sock.sendMessage(from, {
        text: text + '\n\n⚠️ *مفيش صورة بروفايل*',
        mentions: [target]
      }, { quoted: msg })
    }

  } catch (err) {
    console.log('❌ Profile Error:', err.message)
    await sock.sendMessage(from, { text: `❌ *فشل سحب البروفايل*\n\n${err.message}` }, { quoted: msg })
  }
}
