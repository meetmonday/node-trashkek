import { format, bold } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki, safeReply, userName } from '@/helpers/shared'

export default (bot: BotType) =>
  bot.command("burn", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      if (!ctx.args) {
        await ctx.reply('🔥 Укажи сумму. /burn 50')
        return
      }

      const amount = parseInt(ctx.args.trim(), 10)
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('Сумма должна быть положительным числом')
        return
      }

      bipbank.burn(userId, amount)

      const user = bipbank.getUser(userId)
      const name = userName(ctx.from, userId)

      await ctx.reply(format`🔥 ${bold(name)} испарил ${bold(String(amount))} ${pluralizeBipki(amount)}!\n💀 Всего сожжено: ${bold(String(user.total_burned))}`)
    } catch (e: any) {
      const msg =
        e?.message === 'Insufficient balance'
          ? 'Недостаточно бипок для сжигания'
          : 'Ошибка'
      await safeReply(ctx, msg)
    }
  })
