import { format, bold, join, type MessageContext } from 'gramio'
import { bipbank, TX_TYPE } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki, safeReply } from '@/helpers/shared'

type CmdCtx = MessageContext<BotType> & { args: string | null }

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

setInterval(() => {
  const today = new Date().toISOString().slice(0, 10)
  for (const key of dailyNotified) {
    if (!key.endsWith(':' + today)) dailyNotified.delete(key)
  }
}, 24 * 60 * 60 * 1000)

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
  bot.command("daily", async (ctx: CmdCtx) => {
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
      const total = base + Math.round(bonus * bipbank.stabilizer.coeff)

      const received = bipbank.deposit(userId, total, TX_TYPE.daily, `Streak: ${streak}`)
      bipbank.updateUser(userId, { streak, last_daily: today })

      const parts = [format`🎁 Ежедневный бонус: ${bold(String(base))}`]
      if (bonus > 0) {
        const e = bonus >= 85 ? '💥' : bonus >= 45 ? '✨' : '🌟'
        parts.push(format` + ${e}${bold(String(bonus))}`)
      }
      parts.push(format` = ${bold(String(received))} ${pluralizeBipki(received)}! (Streak: ${String(streak)})`)
      const coeff = bipbank.stabilizer.coeff
      if (coeff !== 1.0) parts.push(format`\n📊 Экономика ×${coeff.toFixed(2)}`)
      const pCoeff = bipbank.charity.getPersonalCoeff(userId)
      if (pCoeff > 1.0) parts.push(format`\n❤️ Благотворительность +${Math.round((pCoeff - 1) * 100)}%`)

      await ctx.reply(join(parts, ''))
    } catch {
      await safeReply(ctx, 'Ошибка при получении бонуса')
    }
  })
