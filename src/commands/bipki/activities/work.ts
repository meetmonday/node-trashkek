import { format, bold, join, type MessageContext } from 'gramio'
import { bipbank, TX_TYPE } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki, safeReply, userName } from '@/helpers/shared'

type CmdCtx = MessageContext<BotType> & { args: string | null }

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
  bot.command("work", async (ctx: CmdCtx) => {
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

      const received = bipbank.deposit(userId, amount, TX_TYPE.work, job)
      bipbank.updateUser(userId, { last_work: String(Date.now()) })

      const name = userName(ctx.from, userId)
      const parts = [format`💼 ${bold(name)} ${job} и заработал ${bold(String(received))} ${pluralizeBipki(received)}!`]
      const coeff = bipbank.stabilizer.coeff
      if (coeff !== 1.0) parts.push(format`\n📊 Экономика ×${coeff.toFixed(2)}`)
      const pCoeff = bipbank.charity.getPersonalCoeff(userId)
      if (pCoeff > 1.0) parts.push(format`\n❤️ Благотворительность +${Math.round((pCoeff - 1) * 100)}%`)
      await ctx.reply(join(parts, ''))
    } catch {
      await safeReply(ctx, 'Ошибка')
    }
  })
