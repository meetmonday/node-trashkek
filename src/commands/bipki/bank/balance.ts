import { format, bold, join, type MessageContext } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki, safeReply, userName, resolveTarget } from '@/helpers/shared'

type CmdCtx = MessageContext<BotType> & { args: string | null }

export default (bot: BotType) =>
  bot.command("bipki", async (ctx: CmdCtx) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      let targetId = userId
      let targetName = userName(ctx.from, userId)

      const resolved = resolveTarget(ctx)
      if (resolved.targetId) {
        targetId = resolved.targetId
        targetName = resolved.targetName || userName(ctx.from, userId)
      }

      if (ctx.args) {
        const trimmed = ctx.args.trim()
        if (/^\d+$/.test(trimmed)) {
          targetId = parseInt(trimmed, 10)
          targetName = userName(ctx.from, targetId)
        }
      }

      const user = bipbank.getUser(targetId)

      const parts = [
        format`🅱️ Баланс ${bold(targetName)}: ${bold(String(user.balance))} ${pluralizeBipki(user.balance)}`,
      ]
      if (targetId === userId && user.streak > 0)
        parts.push(format`\n📅 Streak: ${bold(String(user.streak))} дн.`)
      if (user.total_burned > 0)
        parts.push(format`\n🔥 Всего сожжено: ${bold(String(user.total_burned))}`)

      await ctx.reply(join(parts, ''))
    } catch {
      await safeReply(ctx, 'Ошибка при получении баланса')
    }
  })
