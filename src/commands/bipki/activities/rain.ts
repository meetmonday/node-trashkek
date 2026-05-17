import { format, bold, join } from 'gramio'
import { bipbank } from '@/bipbank'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki } from '@/helpers/shared'

export default (bot: BotType) =>
  bot.command("rain", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      const chatId = ctx.chat?.id
      if (!userId || !chatId || ctx.chat?.type === 'private') {
        await ctx.reply('🌧 Дождь работает только в группах')
        return
      }

      if (!ctx.args) {
        await ctx.reply('🌧 Укажи сумму. /rain 100')
        return
      }

      const amount = parseInt(ctx.args.trim(), 10)
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('Сумма должна быть положительным числом')
        return
      }

      const fee = Math.ceil(amount * 0.05)
      const pool = amount - fee

      if (pool < 3) {
        await ctx.reply(`🌧 Минимальная сумма для дождя — 4 ${pluralizeBipki(4)}`)
        return
      }

      const others = bipbank
        .getChatUserIds(chatId)
        .filter((id) => id !== userId)

      if (others.length < 2) {
        await ctx.reply('🌧 В чате недостаточно пользователей для дождя')
        return
      }

      const shuffled = others.sort(() => Math.random() - 0.5)
      const count = Math.min(5, shuffled.length)
      const pick = shuffled.slice(0, count)

      const shares = new Array(count).fill(0)
      let rem = pool
      for (let i = 0; i < count - 1; i++) {
        const max = rem - (count - i - 1)
        const s = Math.floor(Math.random() * max) + 1
        shares[i] = s
        rem -= s
      }
      shares[count - 1] = rem

      const recipients = pick.map((id, i) => ({ userId: id, amount: shares[i]! }))
      bipbank.rainDistribute(userId, recipients, fee)

      const items = recipients.map((r) => {
        const u = bipbank.getUser(r.userId)
        const name = u.username || `user${r.userId}`
        return format`${name}: ${bold(String(r.amount))}`
      })
      const parts = [
        format`🌧 ${bold(ctx.from?.first_name || ctx.from?.username || `user${userId}`)} устроил дождь!`,
        join(items, ', '),
      ]
      if (fee > 0) parts.push(format`\n🔥 ${bold(String(fee))} сгорело в атмосфере`)

      await ctx.reply(join(parts, '\n'))
    } catch (e: any) {
      const msg =
        e?.message === 'Insufficient balance'
          ? 'Недостаточно бипок'
          : 'Ошибка дождя'
      await ctx.reply(msg).catch(() => {})
    }
  })
