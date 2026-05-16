import { bipbank } from '@/bipbank'
import type { BotType } from '../..'
import { ensureBipkiUser, pluralizeBipki } from './shared'

interface CoinflipLogEntry {
  userId: number
  name: string
  side: 'heads' | 'tails'
  won: boolean
  payout: number
}

interface CoinflipGame {
  chatId: number
  messageId: number
  creatorId: number
  creatorName: string
  bet: number
  closed: boolean
  log: CoinflipLogEntry[]
}

const games = new Map<string, CoinflipGame>()
const MAX_LOG = 20

function gameKey(chatId: number, messageId: number): string {
  return `${chatId}:${messageId}`
}

function renderGame(g: CoinflipGame): string {
  const lines = [
    `🪙 Монетка | Ставка: ${g.bet} ${pluralizeBipki(g.bet)} | ×1.95`,
    `Создатель: ${g.creatorName}`,
    '',
  ]
  if (g.closed) {
    lines.push('🚫 Игра завершена')
    lines.push('')
  }
  if (g.log.length > 0) {
    lines.push('📋 Лог (последние 5):')
    const display = g.log.slice(-5)
    for (const entry of display) {
      const emoji = entry.side === 'heads' ? '🦅' : '🌿'
      const outcome = entry.won
        ? `✅ выиграл ${entry.payout} (+${entry.payout - g.bet})`
        : `❌ проиграл ${g.bet}`
      lines.push(`${entry.name}: ${emoji} ${outcome}`)
    }
  }
  return lines.join('\n')
}

const KEYBOARD: any = {
  inline_keyboard: [
    [
      { text: '🦅 Орёл', callback_data: 'cf:heads' },
      { text: '🌿 Решка', callback_data: 'cf:tails' },
    ],
    [
      { text: '🏁 Закрыть', callback_data: 'cf:close' },
    ],
  ],
}

export default (bot: BotType) => {
  bot.command("coinflip", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId || !ctx.chat?.id) return

      if (!ctx.args) {
        await ctx.reply('🪙 Укажи ставку. /coinflip 50')
        return
      }

      const bet = parseInt(ctx.args.trim(), 10)
      if (isNaN(bet) || bet <= 0) {
        await ctx.reply('Ставка должна быть положительным числом')
        return
      }
      if (bet < 10) {
        await ctx.reply('Минимальная ставка — 10 бипок')
        return
      }
      if (bet > 500) {
        await ctx.reply('Максимальная ставка — 500 бипок')
        return
      }
      if (bipbank.balance(userId) < bet) {
        await ctx.reply('Недостаточно бипок для создания игры')
        return
      }

      const name = ctx.from?.first_name || ctx.from?.username || `user${userId}`
      const text = `🪙 Монетка | Ставка: ${bet} ${pluralizeBipki(bet)} | ×1.95\nСоздатель: ${name}\n\nНажимай кнопку, чтобы сделать ставку!`

      const sent = await ctx.reply(text, { reply_markup: KEYBOARD })
      const msgId = sent?.id
      if (!msgId) return

      games.set(gameKey(ctx.chat.id, msgId), {
        chatId: ctx.chat.id,
        messageId: msgId,
        creatorId: userId,
        creatorName: name,
        bet,
        closed: false,
        log: [],
      })
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })

  bot.on('callback_query', async (ctx: any) => {
    try {
      const raw = ctx.update?.callback_query?.data || ctx.payload?.data
      if (!raw || typeof raw !== 'string' || !raw.startsWith('cf:')) return

      const action = raw.slice(3) as 'heads' | 'tails' | 'close'
      if (action !== 'heads' && action !== 'tails' && action !== 'close') return

      const chatId = ctx.chatId
      const msgId = ctx.message?.id
      if (!chatId || !msgId) return

      const key = gameKey(chatId, msgId)
      const game = games.get(key)
      if (!game) {
        await ctx.answerCallbackQuery({ text: 'Игра не найдена', show_alert: true })
        return
      }
      if (game.closed) {
        await ctx.answerCallbackQuery({ text: 'Игра уже закрыта', show_alert: true })
        return
      }

      const userId = ensureBipkiUser(ctx)
      if (!userId) {
        await ctx.answerCallbackQuery({ text: 'Ошибка', show_alert: true })
        return
      }
      const name = ctx.from?.first_name || ctx.from?.username || `user${userId}`

      if (action === 'close') {
        if (userId !== game.creatorId) {
          await ctx.answerCallbackQuery({ text: 'Только создатель может закрыть игру', show_alert: true })
          return
        }
        game.closed = true
        await ctx.editText(renderGame(game), { reply_markup: KEYBOARD })
        await ctx.answerCallbackQuery({ text: 'Игра закрыта' })
        return
      }

      if (bipbank.balance(userId) < game.bet) {
        await ctx.answerCallbackQuery({ text: `Недостаточно бипок (нужно ${game.bet})`, show_alert: true })
        return
      }

      const side = action as 'heads' | 'tails'
      const sideEmoji = side === 'heads' ? '🦅' : '🌿'
      const sideText = side === 'heads' ? 'Орёл' : 'Решка'

      const won = Math.random() < 0.5
      const result = won ? side : (side === 'heads' ? 'tails' : 'heads')
      const resultEmoji = result === 'heads' ? '🦅' : '🌿'
      const resultText = result === 'heads' ? 'Орёл' : 'Решка'

      if (!bipbank.withdraw(userId, game.bet, 'gambled', `Coinflip bet: ${side}`)) {
        await ctx.answerCallbackQuery({ text: 'Ошибка при списании', show_alert: true })
        return
      }

      let payout = 0
      let alertText: string
      if (won) {
        payout = Math.ceil(game.bet * 1.95)
        bipbank.deposit(userId, payout, 'gambled', `Coinflip win: ${side}`)
        alertText = `🪙 ${sideEmoji} ${sideText} → ${resultEmoji} ${resultText}: ВЫИГРАЛ ${payout} ${pluralizeBipki(payout)} (+${payout - game.bet}) | Баланс: ${bipbank.balance(userId)} ${pluralizeBipki(bipbank.balance(userId))}`
      } else {
        alertText = `🪙 ${sideEmoji} ${sideText} → ${resultEmoji} ${resultText}: ПРОИГРАЛ ${game.bet} ${pluralizeBipki(game.bet)} | Баланс: ${bipbank.balance(userId)} ${pluralizeBipki(bipbank.balance(userId))}`
      }

      game.log.push({ userId, name, side, won, payout })
      if (game.log.length > MAX_LOG + 10) {
        game.log.splice(0, game.log.length - MAX_LOG)
      }

      await ctx.editText(renderGame(game), { reply_markup: KEYBOARD })
      await ctx.answerCallbackQuery({ text: alertText, show_alert: true })
    } catch {
      /* silent */
    }
  })
}
