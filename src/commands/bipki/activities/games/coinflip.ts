import { format, bold } from 'gramio'
import { bipbank, TX_TYPE } from '@/economy'
import type { BotType } from '@/index'
import { ensureBipkiUser, pluralizeBipki, userName } from '@/helpers/shared'
import {
  gameKey, MAX_LOG, MIN_BET, MAX_BET, parseGameBet, newBet,
  renderGameHeader, renderGameLogLines,
  type GameBase, type GameLogEntry,
} from '@/helpers/games'

interface CoinflipGame extends GameBase {
  log: GameLogEntry[]
}

const games = new Map<string, CoinflipGame>()

const KEYBOARD: any = {
  inline_keyboard: [
    [
      { text: '🦅 Орёл', callback_data: 'cf:heads' },
      { text: '🌿 Решка', callback_data: 'cf:tails' },
    ],
    [
      { text: '✖️ x2', callback_data: 'cf:double' },
      { text: '➗ x0.5', callback_data: 'cf:halve' },
      { text: '🏁 Закрыть', callback_data: 'cf:close' },
    ],
  ],
}

function renderGame(g: CoinflipGame): string {
  return [
    ...renderGameHeader('🪙', 'Монетка', g, '×2', g.log),
    ...renderGameLogLines(g.log, g.creatorName),
  ].join('\n')
}

export default (bot: BotType) => {
  bot.command("coinflip", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId || !ctx.chat?.id) return

      const { bet, error } = parseGameBet(ctx.args?.trim())
      if (error) {
        await ctx.reply(`🪙 ${error}. /coinflip ${MIN_BET}`)
        return
      }
      if (bipbank.balance(userId) < bet) {
        await ctx.reply('Недостаточно бипок для создания игры')
        return
      }

      const name = userName(ctx.from, userId)
      const sent = await ctx.reply(renderGame({ chatId: ctx.chat.id, messageId: 0, creatorId: userId, creatorName: name, bet, closed: false, log: [] }), { reply_markup: KEYBOARD })
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

  bot.on('callback_query', async (ctx: any, next: any) => {
    try {
      const raw = ctx.update?.callback_query?.data || ctx.payload?.data
      if (!raw || typeof raw !== 'string' || !raw.startsWith('cf:')) return next()

      const action = raw.slice(3) as 'heads' | 'tails' | 'close' | 'double' | 'halve'
      if (action !== 'heads' && action !== 'tails' && action !== 'close' && action !== 'double' && action !== 'halve') return

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
      const name = userName(ctx.from, userId)

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

      if (action === 'double' || action === 'halve') {
        if (userId !== game.creatorId) {
          await ctx.answerCallbackQuery({ text: 'Только создатель может менять ставку', show_alert: true })
          return
        }
        const nb = newBet(game.bet, action)
        if (nb === game.bet) {
          await ctx.answerCallbackQuery({ text: `Ставка уже ${game.bet} ${pluralizeBipki(game.bet)}` })
          return
        }
        game.bet = nb
        await ctx.editText(renderGame(game), { reply_markup: KEYBOARD })
        await ctx.answerCallbackQuery({ text: `Ставка изменена: ${nb} ${pluralizeBipki(nb)}` })
        return
      }

      if (bipbank.balance(userId) < game.bet) {
        await ctx.answerCallbackQuery({ text: `Недостаточно бипок (нужно ${game.bet})`, show_alert: true })
        return
      }

      const side = action as 'heads' | 'tails'
      const sideEmoji = side === 'heads' ? '🦅' : '🌿'

      const won = Math.random() < 0.5

      if (!bipbank.withdraw(userId, game.bet, TX_TYPE.gambled, `Coinflip bet: ${side}`)) {
        await ctx.answerCallbackQuery({ text: 'Ошибка при списании', show_alert: true })
        return
      }

      let payout = 0
      let alertText: string
      if (won) {
        payout = Math.ceil(game.bet * 2)
        bipbank.deposit(userId, payout, TX_TYPE.gambled, `Coinflip win: ${side}`)
        alertText = `🪙 ${sideEmoji} ${side === 'heads' ? 'Орёл' : 'Решка'} → ${sideEmoji} ${side === 'heads' ? 'Орёл' : 'Решка'}: ВЫИГРАЛ ${payout} ${pluralizeBipki(payout)} (+${payout - game.bet}) | Баланс: ${bipbank.balance(userId)} ${pluralizeBipki(bipbank.balance(userId))}`
      } else {
        bipbank.heist.processGamblingLoss(game.bet)
        const result = side === 'heads' ? '🌿 Решка' : '🦅 Орёл'
        alertText = `🪙 ${sideEmoji} ${side === 'heads' ? 'Орёл' : 'Решка'} → ${result}: ПРОИГРАЛ ${game.bet} ${pluralizeBipki(game.bet)} | Баланс: ${bipbank.balance(userId)} ${pluralizeBipki(bipbank.balance(userId))}`
      }

      const arenaEvent = bipbank.arena.addScore(chatId, userId, payout - game.bet)

      game.log.push({
        name,
        display: sideEmoji,
        winName: won ? 'Выиграл' : 'Проиграл',
        bet: game.bet,
        payout,
      })
      if (game.log.length > MAX_LOG + 10) {
        game.log.splice(0, game.log.length - MAX_LOG)
      }

      if (arenaEvent) {
        const msg = arenaEvent.type === 'takeover'
          ? format`🏟️ ${bold(userName(ctx.from, arenaEvent.top[0].userId))} выходит в лидеры Арены — ${bold(String(arenaEvent.top[0].score))} ${pluralizeBipki(arenaEvent.top[0].score)}!`
          : format`🏟️ ${bold(userName(ctx.from, arenaEvent.top[0].userId))} удерживает лидерство 3 дня — ${bold(String(arenaEvent.top[0].score))} ${pluralizeBipki(arenaEvent.top[0].score)}!`
        await ctx.reply(msg).catch(() => {})
      }

      await ctx.editText(renderGame(game), { reply_markup: KEYBOARD })
      await ctx.answerCallbackQuery({ text: alertText, show_alert: true })
    } catch {
      /* silent */
    }
  })
}
