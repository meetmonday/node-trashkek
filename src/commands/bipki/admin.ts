import { format, bold, type MessageContext } from 'gramio'
import { bipbank, TX_TYPE } from '@/economy'
import type { BotType } from '../..'
import { ensureBipkiUser, pluralizeBipki, safeReply, userName, resolveTarget } from '@/helpers/shared'

type CmdCtx = MessageContext<BotType> & { args: string | null }

const ADMIN_IDS = new Set(
  (process.env.ADMIN_IDS || '187365207').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)),
)

function parseRollbackTimestamp(raw: string): number | null {
  const trimmed = raw.trim()

  const relativeMatch = trimmed.match(/^(\d+)\s*(h|m|d|w)$/)
  if (relativeMatch) {
    const num = parseInt(relativeMatch[1]!, 10)
    const unit = relativeMatch[2]!
    const multipliers: Record<string, number> = { m: 60, h: 3600, d: 86400, w: 604800 }
    return Math.floor(Date.now() / 1000) - num * (multipliers[unit] ?? 0)
  }

  const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/)
  if (isoMatch) {
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000)
  }

  const numeric = parseInt(trimmed, 10)
  if (!isNaN(numeric) && numeric > 1000000000) return numeric

  return null
}

export default (bot: BotType) =>
  bot.command("bbadmin", async (ctx: CmdCtx) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return
      if (!ADMIN_IDS.has(userId)) return

      if (!ctx.args) {
        await ctx.reply('Формат:\n/bbadmin {@username | reply} {+/-amount} [причина]\n/bbadmin rollback {timestamp} — откат экономики')
        return
      }

      let argsStr = ctx.args.trim()

      if (argsStr.toLowerCase().startsWith('rollback')) {
        const tsRaw = argsStr.slice(8).trim()
        if (!tsRaw) {
          await ctx.reply('Укажи timestamp для отката. Примеры:\n/bbadmin rollback 1h\n/bbadmin rollback 2024-06-01\n/bbadmin rollback 1717430400')
          return
        }
        const timestamp = parseRollbackTimestamp(tsRaw)
        if (timestamp === null) {
          await ctx.reply('Не удалось распарсить timestamp. Используй Unix seconds, ISO дату или относительное время (1h, 30m, 7d, 2w)')
          return
        }

        const txCount = bipbank.transactionCountUpTo(timestamp)
        await ctx.reply(format`⏳ Откат до ${bold(String(timestamp))} (unix ts)…
Проверено: ${bold(String(txCount))} транзакций до этого момента.
Делаю backup и откатываю балансы...`)

        const result = bipbank.rollbackTo(timestamp)

        await ctx.reply(format`✅ Откат завершён!
Переиграно транзакций: ${bold(String(result.replayedTxCount))}
Отменено (reverted): ${bold(String(result.revertedTxCount))}
Backup сохранён в data/backups/`)
        return
      }

      let targetId: number | null = null
      let targetName = ''

      const resolved = resolveTarget(ctx)
      if (resolved.targetId) {
        targetId = resolved.targetId
        targetName = resolved.targetName
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
          await ctx.reply('Укажи пользователя через @username или reply, или используй /bbadmin rollback')
          return
        }
      }

      if (targetName.startsWith('@')) {
        const parts = argsStr.split(/\s+/)
        if (parts[0]?.startsWith('@')) argsStr = parts.slice(1).join(' ')
      }

      const amountMatch = argsStr.match(/^([+-]\d+)/)
      if (!amountMatch) {
        await ctx.reply('Укажи сумму с +/- (например +100 или -50)')
        return
      }

      const rawAmount = parseInt(amountMatch[1]!, 10)
      const description = argsStr.slice(amountMatch[0].length).trim() || undefined

      if (rawAmount === 0) {
        await ctx.reply('Сумма не может быть 0')
        return
      }

      const adminName = userName(ctx.from, userId)

      if (rawAmount > 0) {
        bipbank.deposit(targetId, rawAmount, TX_TYPE.admin, description, false)
        const msg = format`⚙️ ${bold(adminName)} начислил ${bold(String(rawAmount))} ${pluralizeBipki(rawAmount)} ${bold(targetName)}${description ? format`\n📝 "${description}"` : ''}`
        await ctx.reply(msg)
      } else {
        const absAmount = Math.abs(rawAmount)
        if (bipbank.withdraw(targetId, absAmount, TX_TYPE.admin, description, false)) {
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
      await safeReply(ctx, msg)
    }
  })
