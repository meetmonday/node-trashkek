import { format, bold, join } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki } from '@/helpers/shared'

const BASE = [10, 20, 35, 45, 60, 70, 85]

const BONUS = [
  { amount: 5, chance: 0.5 },
  { amount: 25, chance: 0.35 },
  { amount: 45, chance: 0.1 },
  { amount: 85, chance: 0.04 },
  { amount: 170, chance: 0.01 },
]

function todayUTC() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayUTC() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

const dailyNotified = new Set<string>()

function roll(): number {
  const roll = Math.random()
  let cum = 0
  for (const b of BONUS) {
    cum += b.chance
    if (roll < cum) return b.amount
  }
  return 5
}

export default (bot: BotType) =>
  bot.command("daily", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      const user = bipbank.getUser(userId)
      const today = todayUTC()

      if (user.last_daily === today) {
        const key = `${userId}:${today}`
        if (dailyNotified.has(key)) return
        dailyNotified.add(key)
        await ctx.reply(format`🎁 Ты уже получил бонус сегодня. Возвращайся завтра!`)
        return
      }

      const streak =
        user.last_daily === yesterdayUTC() ? user.streak + 1 : 1
      const base = bipbank.stabilizer.getDailyBaseAmount(streak)
      const bonus = roll()
      const total = base + bonus

      bipbank.deposit(userId, total, 'daily', `Streak: ${streak}`)
      bipbank.updateUser(userId, { streak, last_daily: today })

      const parts = [format`🎁 Ежедневный бонус: ${bold(String(base))}`]
      if (bonus > 0) {
        const e = bonus >= 85 ? '💥' : bonus >= 45 ? '✨' : '🌟'
        parts.push(format` + ${e}${bold(String(bonus))}`)
      }
      parts.push(format` = ${bold(String(total))} ${pluralizeBipki(total)}! (Streak: ${String(streak)})`)
      const coeff = bipbank.stabilizer.coeff
      if (coeff !== 1.0) parts.push(format`\n📊 Экономика ×${coeff.toFixed(2)}`)

      await ctx.reply(join(parts, ''))
    } catch {
      await ctx.reply('Ошибка при получении бонуса').catch(() => {})
    }
  })
