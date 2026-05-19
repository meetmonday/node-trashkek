import { format, bold, join } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, safeReply, userName, parsePositiveAmount, randomlyDistribute } from '@/helpers/shared'

export async function distributeRain(
  ctx: any,
  userId: number,
  chatId: number,
  amount: number,
  openingLine?: string,
): Promise<string | null> {
  try {
    const fee = Math.ceil(amount * 0.05)
    const pool = amount - fee

    if (pool < 3) return 'Минимальная сумма для дождя — 4 бипки'

    const others = bipbank
      .getChatUserIds(chatId)
      .filter((id) => id !== userId)

    if (others.length < 2) return 'В чате недостаточно пользователей для дождя'

    const recipients = randomlyDistribute(others, pool, Math.min(5, others.length))
    if (recipients.length < 2) return 'В чате недостаточно пользователей для дождя'

    bipbank.rainDistribute(userId, recipients, fee)

    const items = recipients.map((r) => {
      const u = bipbank.getUser(r.userId)
      const name = u.username || `user${r.userId}`
      return format`${name}: ${bold(String(r.amount))}`
    })
    const parts = [
      openingLine ?? format`🌧 ${bold(userName(ctx.from, userId))} устроил дождь!`,
      join(items, ', '),
    ]
    if (fee > 0) parts.push(format`\n🔥 ${bold(String(fee))} сгорело в атмосфере`)

    await ctx.reply(join(parts, '\n'))
    return null
  } catch (e: any) {
    if (e?.message === 'Insufficient balance') return 'Недостаточно бипок'
    return 'Ошибка дождя'
  }
}

export default (bot: BotType) =>
  bot.command("rain", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      const chatId = ctx.chat?.id
      if (!userId || !chatId || ctx.chat?.type === 'private') {
        await ctx.reply('🌧 Дождь работает только в группах')
        return
      }

      const { amount, error } = parsePositiveAmount(ctx.args)
      if (error) {
        await ctx.reply('🌧 ' + error)
        return
      }

      const err = await distributeRain(ctx, userId, chatId, amount)
      if (err) await ctx.reply(`🌧 ${err}`)
    } catch (e: any) {
      await safeReply(ctx, 'Ошибка дождя')
    }
  })
