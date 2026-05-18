import { format, bold } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../..'
import { ensureBipkiUser, pluralizeBipki } from '@/helpers/shared'

const ADMIN_IDS = new Set(
  (process.env.ADMIN_IDS || '187365207').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)),
)

export default (bot: BotType) =>
  bot.command("bbadmin", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return
      if (!ADMIN_IDS.has(userId)) return

      if (!ctx.args) {
        await ctx.reply('Формат: /admin {@username | reply} {+/-amount} [причина]')
        return
      }

      let argsStr = ctx.args.trim()
      let targetId: number | null = null
      let targetName = ''

      if (ctx.replyMessage?.from) {
        targetId = ctx.replyMessage.from.id
        targetName = ctx.replyMessage.from.first_name || ctx.replyMessage.from.username || `user${targetId}`
      }

      if (ctx.entities) {
        for (const e of ctx.entities) {
          if (e.type === 'text_mention' && e.user) {
            targetId = e.user.id
            targetName = e.user.first_name || e.user.username || `user${targetId}`
            break
          }
          if (e.type === 'mention') {
            const mention = ctx.text?.slice(e.offset, e.offset + e.length)?.replace('@', '')
            if (mention) {
              const found = bipbank.findByUsername(mention)
              if (found !== null) {
                targetId = found
                targetName = `@${mention}`
                break
              }
            }
          }
        }
      }

      if (!targetId) {
        const parts = argsStr.split(/\s+/)
        const first = parts[0]
        if (first?.startsWith('@')) {
          const found = bipbank.findByUsername(first.slice(1))
          if (found !== null) {
            targetId = found
            targetName = first
          } else {
            await ctx.reply(`Пользователь ${first} не найден`)
            return
          }
        } else {
          await ctx.reply('Укажи пользователя через @username или reply')
          return
        }
      }

      if (ctx.replyMessage?.from) {
        argsStr = argsStr
      } else if (targetName.startsWith('@')) {
        const parts = argsStr.split(/\s+/)
        if (parts[0]?.startsWith('@')) argsStr = parts.slice(1).join(' ')
      }

      const amountMatch = argsStr.match(/^([+-]?\d+)/)
      if (!amountMatch) {
        await ctx.reply('Укажи сумму с +/- (например +100 или -50)')
        return
      }

      const rawAmount = parseInt(amountMatch[1], 10)
      const description = argsStr.slice(amountMatch[0].length).trim() || undefined

      if (rawAmount === 0) {
        await ctx.reply('Сумма не может быть 0')
        return
      }

      const adminName = ctx.from.first_name || ctx.from.username || `user${userId}`

      if (rawAmount > 0) {
        bipbank.deposit(targetId, rawAmount, 'admin', description)
        const msg = format`⚙️ ${bold(adminName)} начислил ${bold(String(rawAmount))} ${pluralizeBipki(rawAmount)} ${bold(targetName)}${description ? format`\n📝 "${description}"` : ''}`
        await ctx.reply(msg)
      } else {
        const absAmount = Math.abs(rawAmount)
        if (bipbank.withdraw(targetId, absAmount, 'admin', description)) {
          const msg = format`⚙️ ${bold(adminName)} списал ${bold(String(absAmount))} ${pluralizeBipki(absAmount)} у ${bold(targetName)}${description ? format`\n📝 "${description}"` : ''}`
          await ctx.reply(msg)
        } else {
          await ctx.reply('Недостаточно бипок у пользователя')
        }
      }
    } catch (e: any) {
      const msg = e?.message === 'Insufficient balance'
        ? 'Недостаточно бипок у пользователя'
        : (e?.message || 'Ошибка')
      await ctx.reply(msg).catch(() => {})
    }
  })
