import { bipbank, TX_TYPE } from '@/economy'
import type { BotType } from '@/index'
import { ensureBipkiUser, pluralizeBipki, userName } from '@/helpers/shared'
import {
  sleep, gameKey, MAX_LOG, MIN_BET, MAX_BET,
  parseGameBet, gameKeyboard, renderGameHeader, renderGameLogLines,
  newBet, deleteDiceMsg,
  type GameBase, type GameLogEntry,
} from '@/helpers/games'

const SYMBOLS = [
  { emoji: '🎰', name: 'BAR' },
  { emoji: '🍇', name: 'Виноград' },
  { emoji: '🍋', name: 'Лимон' },
  { emoji: '7️⃣', name: 'Семёрка' },
] as const

interface SlotsGame extends GameBase {
  log: GameLogEntry[]
  diceMsgId?: number
}

const games = new Map<string, SlotsGame>()
const KEYBOARD = gameKeyboard('sl', 'Крутить', '🎰')

function sym(n: number) {
  return SYMBOLS[n]!
}

export function getSlotResult(value: number): { payoutMult: number; display: string; winName: string } {
  const n = value - 1
  const a = n & 3
  const b = (n >> 2) & 3
  const c = (n >> 4) & 3

  const display = [sym(a).emoji, sym(b).emoji, sym(c).emoji].join(' ')

  if (a === b && b === c) {
    if (a === 3) return { payoutMult: 10, display, winName: `Джекпот! Три ${sym(a).name}` }
    if (a === 0) return { payoutMult: 5, display, winName: `Три ${sym(a).name}` }
    if (a === 1) return { payoutMult: 3, display, winName: `Три ${sym(a).name}` }
    return { payoutMult: 2, display, winName: `Три ${sym(a).name}` }
  }

  if (a === b || b === c || a === c) {
    const pairVal = a === b ? a : c
    return { payoutMult: 1, display, winName: `Пара ${sym(pairVal).name}` }
  }

  return { payoutMult: 0, display, winName: 'Мимо' }
}

function renderGame(g: SlotsGame): string {
  return [
    ...renderGameHeader('🎰', 'Слот-машина', g, undefined, g.log),
    ...renderGameLogLines(g.log, g.creatorName),
  ].join('\n')
}

export default (bot: BotType) => {
  bot.command("slots", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId || !ctx.chat?.id) return

      const { bet, error } = parseGameBet(ctx.args?.trim())
      if (error) {
        await ctx.reply(`🎰 ${error}. /slots ${MIN_BET}`)
        return
      }
      if (bipbank.balance(userId) < bet) {
        await ctx.reply('Недостаточно бипок для создания игры')
        return
      }

      const name = userName(ctx.from, userId)
      const sent = await ctx.reply(
        `🎰 Слот-машина | Ставка: ${bet} ${pluralizeBipki(bet)}\nСоздатель: ${name}\n\nНажимай кнопку, чтобы крутить!`,
        { reply_markup: KEYBOARD },
      )
      const msgId = sent?.id
      if (!msgId) return

      games.set(gameKey(ctx.chat.id, msgId), {
        chatId: ctx.chat.id, messageId: msgId,
        creatorId: userId, creatorName: name,
        bet, closed: false, log: [],
      })
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })

  bot.on('callback_query', async (ctx: any, next: any) => {
    const raw = ctx.update?.callback_query?.data || ctx.payload?.data
    if (typeof raw !== 'string' || !raw.startsWith('sl:')) return next()

    try { await ctx.answerCallbackQuery({}) } catch { return }

    try {
      const action = raw.slice(3) as 'spin' | 'close' | 'double' | 'halve'
      if (!['spin', 'close', 'double', 'halve'].includes(action)) return

      const chatId = ctx.chatId
      const msgId = ctx.message?.id
      if (!chatId || !msgId) return

      const key = gameKey(chatId, msgId)
      const game = games.get(key)
      if (!game) return
      if (game.closed) {
        await ctx.editText(renderGame(game), { reply_markup: KEYBOARD })
        return
      }

      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      const name = userName(ctx.from, userId)

      if (action === 'close') {
        if (userId !== game.creatorId) return
        game.closed = true
        await deleteDiceMsg(bot, chatId, game.diceMsgId)
        await ctx.editText(renderGame(game), { reply_markup: KEYBOARD })
        return
      }

      if (action === 'double' || action === 'halve') {
        if (userId !== game.creatorId) return
        const nb = newBet(game.bet, action)
        if (nb !== game.bet) {
          game.bet = nb
          await ctx.editText(renderGame(game), { reply_markup: KEYBOARD })
        }
        return
      }

      // --- Spin ---
      if (bipbank.balance(userId) < game.bet) return
      if (!bipbank.withdraw(userId, game.bet, TX_TYPE.gambled, `Slots bet`)) return

      await deleteDiceMsg(bot, chatId, game.diceMsgId)

      let diceValue: number | undefined
      try {
        const diceMsg = await bot.api.sendDice({ chat_id: chatId, emoji: '🎰' })
        diceValue = diceMsg.dice?.value
        game.diceMsgId = diceMsg.message_id
      } catch {
        bipbank.deposit(userId, game.bet, TX_TYPE.gambled, `Slots refund`)
        return
      }

      if (!diceValue) {
        bipbank.deposit(userId, game.bet, TX_TYPE.gambled, `Slots refund`)
        return
      }

      await sleep(2000)

      const result = getSlotResult(diceValue)
      const payout = Math.ceil(game.bet * result.payoutMult)

      if (payout > 0) {
        bipbank.deposit(userId, payout, TX_TYPE.gambled, `Slots win: ${result.winName}`)
      }

      game.log.push({
        name,
        display: result.display,
        winName: result.winName,
        bet: game.bet,
        payout,
      })
      if (game.log.length > MAX_LOG + 10) {
        game.log.splice(0, game.log.length - MAX_LOG)
      }

      await ctx.editText(renderGame(game), { reply_markup: KEYBOARD })
    } catch {
      /* silent */
    }
  })
}
