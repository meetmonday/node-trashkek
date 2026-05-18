import { format, bold } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki } from '@/helpers/shared'

const JOBS = [
  'вынес мусор 🗑️', 'покормил кота 🐱', 'помыл посуду 🍽️',
  'сходил в магазин 🛒', 'погладил бельё 👕', 'полил цветы 🌸',
  'выгулял собаку 🐕', 'протёр пыль 🧹', 'заправил кровать 🛏️',
  'приготовил ужин 🍳', 'помыл машину 🚗', 'пропылесосил 🌀',
  'починил кран 🔧', 'рассортировал носки 🧦', 'покормил рыбок 🐟',
  'собрал конструктор 🧱', 'вытер стол 🧽', 'посадил дерево 🌱',
]

const COOLDOWN = 7_200_000

export default (bot: BotType) =>
  bot.command("work", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      const user = bipbank.getUser(userId)

      if (user.last_work) {
        const elapsed = Date.now() - Number(user.last_work)
        if (elapsed < COOLDOWN) {
          const m = Math.ceil((COOLDOWN - elapsed) / 60000)
          await ctx.reply(format`⏳ Отдохни ещё ${bold(String(m))} мин`)
          return
        }
      }

      const amount = bipbank.stabilizer.getWorkAmount()
      const job = JOBS[Math.floor(Math.random() * JOBS.length)]

      bipbank.deposit(userId, amount, 'work', job)
      bipbank.updateUser(userId, { last_work: String(Date.now()) })

      const name = ctx.from?.first_name || ctx.from?.username || `user${userId}`
      const coeff = bipbank.stabilizer.coeff
      const econNote = coeff !== 1.0 ? `\n📊 Экономика ×${coeff.toFixed(2)}` : ''
      await ctx.reply(format`💼 ${bold(name)} ${job} и заработал ${bold(String(amount))} ${pluralizeBipki(amount)}!${econNote}`)
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })
