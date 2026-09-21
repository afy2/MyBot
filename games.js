// ═══════════════════════════════════════════════════════
// 🎮 الألعاب - 𝑩𝑶𝑻 𝑫𝑨𝑹𝑲
// ═══════════════════════════════════════════════════════

if (!global.games) global.games = { xo: new Map(), guess: new Map(), rps: new Map() }

export async function playXO(sock, from, msg, senderJid, senderNum) {
  const gameKey = `xo_${from}`
  const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
  const args = text.split(' ').slice(1)

  if (global.games.xo.has(gameKey)) {
    const game = global.games.xo.get(gameKey)
    if (game.player1 !== senderJid && game.player2 !== senderJid) {
      return sock.sendMessage(from, { text: '⚠️ اللعبة شغالة' }, { quoted: msg })
    }
    const num = parseInt(args[0] || text)
    if (num >= 1 && num <= 9 && !game.board[num - 1]) {
      const symbol = game.turn === game.player1 ? '❌' : '⭕'
      game.board[num - 1] = symbol
      const winner = checkXOWinner(game.board)
      if (winner) {
        await sock.sendMessage(from, { text: renderXO(game.board) + `\n\n🎉 *فاز @${game.turn.split('@')[0]}!*`, mentions: [game.turn] })
        global.games.xo.delete(gameKey)
        return
      }
      if (game.board.every(c => c)) {
        await sock.sendMessage(from, { text: renderXO(game.board) + `\n\n🤝 *تعادل!*` })
        global.games.xo.delete(gameKey)
        return
      }
      game.turn = game.turn === game.player1 ? game.player2 : game.player1
      return sock.sendMessage(from, { text: renderXO(game.board) + `\n\n⏳ دور @${game.turn.split('@')[0]}`, mentions: [game.turn] })
    }
    return
  }

  const player2 = getMentioned(msg)
  if (!player2) return sock.sendMessage(from, { text: '❌ اعمل منشن للاعب التاني' }, { quoted: msg })
  if (player2 === senderJid) return sock.sendMessage(from, { text: '❌ لازم تلعب مع حد تاني' }, { quoted: msg })

  const board = [null, null, null, null, null, null, null, null, null]
  global.games.xo.set(gameKey, { player1: senderJid, player2, turn: senderJid, board })

  return sock.sendMessage(from, {
    text: renderXO(board) + `\n\n🎮 *اللعبة بدأت!*\n\n❌ @${senderJid.split('@')[0]}\n⭕ @${player2.split('@')[0]}\n\n⏳ دور @${senderJid.split('@')[0]}\n\n📌 اكتب رقم من 1-9`,
    mentions: [senderJid, player2]
  })
}

function renderXO(board) {
  let str = '```\n'
  for (let i = 0; i < 9; i += 3) {
    str += `${board[i] || (i+1)} │ ${board[i+1] || (i+2)} │ ${board[i+2] || (i+3)}\n`
    if (i < 6) str += '──┼───┼──\n'
  }
  str += '```'
  return str
}

function checkXOWinner(b) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const [a,b_,c] of lines) {
    if (b[a] && b[a] === b[b_] && b[a] === b[c]) return b[a]
  }
  return null
}

export async function playGuess(sock, from, msg, senderJid, senderNum) {
  const gameKey = `guess_${senderJid}`
  const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim()
  const args = text.split(' ').slice(1)

  if (!global.games.guess.has(gameKey)) {
    const number = Math.floor(Math.random() * 100) + 1
    global.games.guess.set(gameKey, { number, tries: 0 })
    return sock.sendMessage(from, {
      text: `🎯 *لعبة التخمين*\n\n🤔 اخترت رقم من 1 لـ 100\n💬 اكتب تخمينك\n\n⏱️ عندك 10 محاولات`
    }, { quoted: msg })
  }

  const game = global.games.guess.get(gameKey)
  const guess = parseInt(args[0] || text)
  if (!guess || guess < 1 || guess > 100) return
  game.tries++

  if (guess === game.number) {
    global.games.guess.delete(gameKey)
    return sock.sendMessage(from, { text: `🎉 *مبروك!*\n✅ الرقم: *${game.number}*\n📊 المحاولات: *${game.tries}*` }, { quoted: msg })
  }

  if (game.tries >= 10) {
    global.games.guess.delete(gameKey)
    return sock.sendMessage(from, { text: `❌ *خسرت!*\n🔢 الرقم: *${game.number}*` }, { quoted: msg })
  }

  const hint = guess < game.number ? '⬆️ الرقم أكبر' : '⬇️ الرقم أصغر'
  return sock.sendMessage(from, { text: `${hint}\n\n🎯 محاولة ${game.tries}/10` }, { quoted: msg })
}

export async function playRPS(sock, from, msg, senderJid, senderNum) {
  const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim().toLowerCase()
  const args = text.split(' ').slice(1)
  const choice = args[0]

  const choices = { 'حجر': '✊', 'ورقة': '✋', 'مقص': '✌️', 'rock': '✊', 'paper': '✋', 'scissors': '✌️' }

  if (!choice || !choices[choice]) {
    return sock.sendMessage(from, {
      text: `✊✋✌️ *حجر ورقة مقص*\n\n📌 اكتب:\n• حجر ورقة مقص حجر\n• حجر ورقة مقص ورقة\n• حجر ورقة مقص مقص`
    }, { quoted: msg })
  }

  const userChoice = choices[choice]
  const botChoices = ['✊', '✋', '✌️']
  const botChoice = botChoices[Math.floor(Math.random() * 3)]

  let result = ''
  if (userChoice === botChoice) result = '🤝 *تعادل!*'
  else if (
    (userChoice === '✊' && botChoice === '✌️') ||
    (userChoice === '✋' && botChoice === '✊') ||
    (userChoice === '✌️' && botChoice === '✋')
  ) result = '🎉 *كسبت!*'
  else result = '❌ *خسرت!*'

  return sock.sendMessage(from, { text: `✊✋✌️ *حجر ورقة مقص*\n\n👤 *انت:* ${userChoice}\n🤖 *البوت:* ${botChoice}\n\n${result}` }, { quoted: msg })
}

export async function playDice(sock, from, msg, senderJid, senderNum) {
  const dice = ['⚀','⚁','⚂','⚃','⚄','⚅']
  const num = Math.floor(Math.random() * 6)
  return sock.sendMessage(from, { text: `🎲 *رمي النرد*\n\n${dice[num]}  *${num + 1}*` }, { quoted: msg })
}

function getMentioned(msg) {
  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  return mentions[0] || null
}
