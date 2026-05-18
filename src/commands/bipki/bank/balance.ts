import { format, bold, join } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki } from '@/helpers/shared'

export default (bot: BotType) =>
  bot.command("bipki", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      let targetId = userId
      let targetName =
        ctx.from?.first_name || ctx.from?.username || `user${userId}`

      if (ctx.replyMessage?.from) {
        targetId = ctx.replyMessage.from.id
        targetName =
          ctx.replyMessage.from.first_name ||
          ctx.replyMessage.from.username ||
          `user${targetId}`
      }

      if (ctx.entities) {
        for (const entity of ctx.entities) {
          if (entity.type === 'mention') {
            const mention = ctx.text
              ?.slice(entity.offset, entity.offset + entity.length)
              ?.replace('@', '')
            if (mention) {
              const found = bipbank.findByUsername(mention)
              if (found !== null) {
                targetId = found
                targetName = `@${mention}`
                break
              }
            }
          }
          if (entity.type === 'text_mention' && entity.user) {
            targetId = entity.user.id
            targetName =
              entity.user.first_name ||
              entity.user.username ||
              `user${targetId}`
            break
          }
        }
      }

      if (ctx.args) {
        const trimmed = ctx.args.trim()
        if (/^\d+$/.test(trimmed)) targetId = parseInt(trimmed, 10)
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
      await ctx.reply('Ошибка при получении баланса').catch(() => {})
    }
  })
