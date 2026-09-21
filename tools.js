// ═══════════════════════════════════════════════════════
// 🛠️ الأدوات - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

export async function decorateText(sock, from, msg, text) {
  if (!text) return sock.sendMessage(from, { text: '📌 اكتب: زخرفة [نص]' }, { quoted: msg })
  const styles = [
    text.split('').join('✦'),
    text.split('').join('❥'),
    text.split('').join('•'),
    text.split('').join('♡'),
    text.split('').map(c => ({ 'ا':'آ','ب':'β','ت':'τ','ث':'θ','ج':'ج','ح':'ح','خ':'خ','د':'δ','ذ':'ذ','ر':'ρ','ز':'ζ','س':'σ','ش':'ش','ص':'ص','ض':'ض','ط':'ط','ظ':'ظ','ع':'ع','غ':'غ','ف':'φ','ق':'ق','ك':'κ','ل':'λ','م':'μ','ن':'η','ه':'ε','و':'ω','ي':'γ' }[c] || c)).join('')
  ]
  const r = styles[Math.floor(Math.random() * styles.length)]
  await sock.sendMessage(from, { text: `✨ *الزخرفة:*\n\n${r}` }, { quoted: msg })
}

export async function reverseText(sock, from, msg, text) {
  if (!text) return sock.sendMessage(from, { text: '📌 اكتب: عكس [نص]' }, { quoted: msg })
  const reversed = text.split('').reverse().join('')
  await sock.sendMessage(from, { text: `🔄 *النص المعكوس:*\n\n${reversed}` }, { quoted: msg })
}

export async function calcExpression(sock, from, msg, expr) {
  if (!expr) return sock.sendMessage(from, { text: `🧮 *الحاسبة*\n📌 اكتب: حاسبة 5+3` }, { quoted: msg })
  try {
    const clean = expr.replace(/[^0-9+\-*/(). %]/g, '')
    if (!clean) throw new Error('عملية غير صالحة')
    const result = Function(`"use strict"; return (${clean})`)()
    await sock.sendMessage(from, { text: `🧮 *الحاسبة*\n\n📥 ${clean}\n✅ *النتيجة:* ${result}` }, { quoted: msg })
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ *عملية غير صالحة*` }, { quoted: msg })
  }
}

export async function randomQuote(sock, from, msg) {
  const quotes = [
    '🌟 "لا تحزن على ما فات، فكل شيء بقدر"',
    '💪 "النجاح يأتي بعد التعب"',
    '🌸 "الحياة قصيرة، عيشها بسعادة"',
    '🔥 "لا تنتظر الفرصة، اصنعها"',
    '💎 "أنت أقوى مما تتصور"',
    '🌙 "الصبر مفتاح الفرج"',
    '⭐ "الحلم لا يتحقق بالتمني"',
    '🌺 "كل يوم فرصة جديدة"',
    '🦋 "التغيير يبدأ منك"',
    '🌞 "غداً أفضل"'
  ]
  const r = quotes[Math.floor(Math.random() * quotes.length)]
  await sock.sendMessage(from, { text: `💬 *اقتباس*\n\n${r}` }, { quoted: msg })
}

export async function randomJoke(sock, from, msg) {
  const jokes = [
    '😂 واحد صاحي الصبح لقي نفسه في حلم... صحى.',
    '😆 مرة واحد راح للدكتور قاله عندي النسيان',
    '🤣 واحد اسمه كامل، اتجوز واحدة اسمها ناقصة، خلفوا سامي.',
    '😂 مرة واحد فتح الثلاجة، لقى الفيل، قاله إيه اللي جابك هنا؟',
    '😆 واحد قال لمراته: هاتيلي فنجان قهوة، قالتله: بس إنت مش بتحب القهوة'
  ]
  const r = jokes[Math.floor(Math.random() * jokes.length)]
  await sock.sendMessage(from, { text: `😄 *نكتة*\n\n${r}` }, { quoted: msg })
}

export async function randomFact(sock, from, msg) {
  const facts = [
    '🧠 هل تعلم أن المخ البشري يستهلك 20% من الأكسجين؟',
    '🦈 هل تعلم أن أسماك القرش موجودة قبل الديناصورات؟',
    '🌍 هل تعلم أن الأرض تدور بسرعة 107,000 كم/س؟',
    '💧 هل تعلم أن جسم الإنسان يحتوي على 60% ماء؟',
    '⚡ هل تعلم أن البرق أسرع من الرعد بـ 1000 مرة؟',
    '🐘 هل تعلم أن الفيل هو الحيوان الوحيد اللي مش بيقفز؟',
    '🦋 هل تعلم أن الفراشة بتتذوق بأرجلها؟',
    '🐬 هل تعلم أن الدلافين بتنادي على بعضها بأسماء؟'
  ]
  const r = facts[Math.floor(Math.random() * facts.length)]
  await sock.sendMessage(from, { text: `📚 *هل تعلم؟*\n\n${r}` }, { quoted: msg })
}
