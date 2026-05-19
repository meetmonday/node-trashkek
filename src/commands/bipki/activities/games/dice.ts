import { bipbank, TX_TYPE } from '@/economy'
import type { BotType } from '@/index'
import { ensureBipkiUser, pluralizeBipki, userName } from '@/helpers/shared'
import {
  sleep, gameKey, MAX_LOG, MIN_BET, MAX_BET,
  parseGameBet, gameKeyboard, renderGameHeader, renderGameLogLines,
  newBet, deleteDiceMsg,
  type GameBase, type GameLogEntry,
} from '@/helpers/games'

const DICE_EMOJI = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'] as const
const DICE_NAMES = ['', 'Единица', 'Двойка', 'Тройка', 'Четвёрка', 'Пятёрка', 'Шестёрка'] as const

interface DiceGame extends GameBase {
  log: GameLogEntry[]
  diceMsgId?: number
}

const games = new Map<string, DiceGame>()
const KEYBOARD = gameKeyboard('di', 'Бросить', '🎲')

export function getDiceResult(value: number): { payoutMult: number; display: string; winName: string } {
  const display = DICE_EMOJI[value]!
  if (value >= 6) return { payoutMult: 3, display, winName: `${DICE_NAMES[value]}!` }
  if (value >= 5) return { payoutMult: 2, display, winName: `${DICE_NAMES[value]}!` }
  if (value >= 4) return { payoutMult: 1, display, winName: DICE_NAMES[value]! }
  return { payoutMult: 0, display, winName: 'Мимо' }
}

function renderGame(g: DiceGame): string {
  return [
    ...renderGameHeader('🎲', 'Кость', g, undefined, g.log),
    ...renderGameLogLines(g.log, g.creatorName),
  ].join('\n')
}

export default (bot: BotType) => {
  bot.command("dice", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId || !ctx.chat?.id) return

      const { bet, error } = parseGameBet(ctx.args?.trim())
      if (error) {
        await ctx.reply(`🎲 ${error}. /dice ${MIN_BET}`)
        return
      }
      if (bipbank.balance(userId) < bet) {
        await ctx.reply('Недостаточно бипок для создания игры')
        return
      }

      const name = userName(ctx.from, userId)
      const sent = await ctx.reply(
        `🎲 Кость | Ставка: ${bet} ${pluralizeBipki(bet)}\nСоздатель: ${name}\n\nНажимай кнопку, чтобы бросить!`,
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
    if (typeof raw !== 'string' || !raw.startsWith('di:')) return next()

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
      if (!bipbank.withdraw(userId, game.bet, TX_TYPE.gambled, `Dice bet`)) return

      await deleteDiceMsg(bot, chatId, game.diceMsgId)

      let diceValue: number | undefined
      try {
        const diceMsg = await bot.api.sendDice({ chat_id: chatId, emoji: '🎲' })
        diceValue = diceMsg.dice?.value
        game.diceMsgId = diceMsg.message_id
      } catch {
        bipbank.deposit(userId, game.bet, TX_TYPE.gambled, `Dice refund`)
        return
      }

      if (!diceValue || diceValue < 1 || diceValue > 6) {
        bipbank.deposit(userId, game.bet, TX_TYPE.gambled, `Dice refund`)
        return
      }

      await sleep(5000)

      const result = getDiceResult(diceValue)
      const payout = Math.ceil(game.bet * result.payoutMult)

      if (payout > 0) {
        bipbank.deposit(userId, payout, TX_TYPE.gambled, `Dice win: ${result.winName}`)
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
