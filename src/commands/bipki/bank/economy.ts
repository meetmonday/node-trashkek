import { format, bold, join } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser } from '@/helpers/shared'

export default (bot: BotType) =>
  bot.command("economy", async (ctx: any) => {
    try {
      ensureBipkiUser(ctx)
      const s = bipbank.economyStats()
      const coeff = bipbank.stabilizer.coeff
      const items = [
        format`💰 Общий баланс: ${bold(String(s.totalSupply))}`,
        format`🔥 Сожжено: ${bold(String(s.totalBurned))}`,
        format`🎲 Проиграно: ${bold(String(s.totalGambled))}`,
        format`📊 Транзакций: ${bold(String(s.totalTransactions))}`,
        format`💼 Заработано работой: ${bold(String(s.totalEarnedWork))}`,
        format`🎁 Заработано daily: ${bold(String(s.totalEarnedDaily))}`,
        format`💸 Переведено: ${bold(String(s.totalTransferred))}`,
        format`👥 Всего: ${bold(String(s.userCount))} / Активно: ${bold(String(s.activeUsers))}`,
        format`⚖ Коэфф. экономики: ${bold(String(coeff.toFixed(2)))}`,
      ]
      await ctx.reply(format`📊 ${bold('Экономика бипок')}\n${join(items, '\n')}`)
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })
