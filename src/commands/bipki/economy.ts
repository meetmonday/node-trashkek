import { format, bold, join } from 'gramio'
import { bipbank } from '@/bipbank'
import type { BotType } from '../..'
import { ensureBipkiUser } from './shared'

export default (bot: BotType) =>
  bot.command("economy", async (ctx: any) => {
    try {
      ensureBipkiUser(ctx)
      const s = bipbank.economyStats()
      const items = [
        format`💰 Общий баланс: ${bold(String(s.totalSupply))}`,
        format`🔥 Сожжено: ${bold(String(s.totalBurned))}`,
        format`📊 Транзакций: ${bold(String(s.totalTransactions))}`,
        format`💼 Заработано работой: ${bold(String(s.totalEarnedWork))}`,
        format`🎁 Заработано daily: ${bold(String(s.totalEarnedDaily))}`,
        format`💸 Переведено: ${bold(String(s.totalTransferred))}`,
        format`👥 Пользователей: ${bold(String(s.userCount))}`,
      ]
      await ctx.reply(format`📊 ${bold('Экономика бипок')}\n${join(items, '\n')}`)
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })
