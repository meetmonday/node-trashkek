import { format, bold, join } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '@/index'
import { ensureBipkiUser, pluralizeBipki } from '@/helpers/shared'

export default (bot: BotType) => {
  bot.command('arena', async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId || !ctx.chat?.id) return

      const chatId = ctx.chat.id
      const top = bipbank.arena.getTop(chatId, 10)
      const week = bipbank.arena.getWeekLabel()

      if (top.length === 0) {
        await ctx.reply('🏟️ Арена | Эта неделя только началась — ставь и выигрывай, чтобы попасть в топ!')
        return
      }

      const userScore = bipbank.arena.getUserScore(chatId, userId)
      const userRank = top.findIndex(r => r.user_id === userId) + 1

      const items = top.map((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
        const name = bipbank.getUser(r.userId).username ?? `user${r.userId}`
        return format`${medal} ${bold(String(r.score))} ${pluralizeBipki(r.score)} | ${name}`
      })

      if (userRank > 0) {
        const place = userRank === 1 ? '1-м' : userRank === 2 ? '2-м' : userRank === 3 ? '3-м' : `${userRank}-м`
        items.push(format`📊 Ты на ${bold(place)} месте — ${bold(String(userScore))} ${pluralizeBipki(userScore)}`)
      }

      await ctx.reply(format`🏟️ ${bold('Арена')} | Неделя ${week}\n${join(items, '\n')}`)
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })
}
