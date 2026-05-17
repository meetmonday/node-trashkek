import { format, bold } from 'gramio'
import { bipbank } from '@/bipbank'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki } from '@/helpers/shared'

function findLastAmount(parts: string[]): { idx: number; amount: number } | null {
  for (let i = parts.length - 1; i >= 0; i--) {
    const n = parseInt(parts[i]!, 10)
    if (!isNaN(n) && n > 0) return { idx: i, amount: n }
  }
  return null
}

function parse(ctx: any): { to?: number; amount?: number; comment?: string; err?: string } {
  if (ctx.replyMessage?.from && ctx.args) {
    const parts = ctx.args.trim().split(/\s+/)
    const found = findLastAmount(parts)
    if (!found) return { err: 'Сумма должна быть числом' }
    return { to: ctx.replyMessage.from.id, amount: found.amount, comment: parts.slice(found.idx + 1).join(' ') }
  }

  if (!ctx.args)
    return {
      err: 'Укажи пользователя и сумму. /transfer @user 100 или /transfer 100 (reply)',
    }

  const parts = ctx.args.trim().split(/\s+/)
  const found = findLastAmount(parts)
  if (!found) return { err: 'Сумма должна быть положительным числом' }

  const { idx: amountIdx, amount } = found
  const comment = parts.slice(amountIdx + 1).join(' ')

  if (ctx.entities) {
    for (const e of ctx.entities) {
      if (e.type === 'text_mention' && e.user)
        return { to: e.user.id, amount, comment }
      if (e.type === 'mention') {
        const mention = ctx.text
          ?.slice(e.offset, e.offset + e.length)
          ?.replace('@', '')
        if (mention) {
          const u = bipbank.findByUsername(mention)
          if (u !== null) return { to: u, amount, comment }
        }
      }
    }
  }

  const idPart = parts.slice(0, amountIdx).join(' ')
  if (/^\d+$/.test(idPart)) return { to: parseInt(idPart, 10), amount, comment }
  if (idPart.startsWith('@')) {
    const u = bipbank.findByUsername(idPart.slice(1))
    if (u !== null) return { to: u, amount, comment }
    return { err: `Пользователь ${idPart} не найден. Он должен сначала написать любую bipki-команду` }
  }

  return { err: 'Не могу определить пользователя. Используй reply или ID' }
}

export default (bot: BotType) =>
  bot.command("transfer", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      const { to, amount, comment, err } = parse(ctx)
      if (err) {
        await ctx.reply(err)
        return
      }
      if (!to || !amount) return

      if (to === userId) {
        await ctx.reply('Нельзя переводить самому себе')
        return
      }

      const r = bipbank.transfer(userId, to, amount, comment || undefined)
      const name =
        ctx.replyMessage?.from?.first_name ||
        ctx.replyMessage?.from?.username ||
        `user${to}`

      const parts: any[] = []
      if (comment) {
        parts.push(format`💸 ${bold(ctx.from.first_name || ctx.from.username)} → ${bold(name)}: ${bold(String(r.received))} ${pluralizeBipki(r.received)}\n📝 "${comment}"`)
      } else {
        parts.push(format`💸 ${bold(ctx.from.first_name || ctx.from.username)} → ${bold(name)}: ${bold(String(r.received))} ${pluralizeBipki(r.received)}`)
      }
      if (r.fee > 0)
        parts.push(format`\n🔥 Комиссия ${bold(String(r.fee))} сгорела`)

      await ctx.reply(parts.join(''))
    } catch (e: any) {
      const msg =
        e?.message === 'Insufficient balance'
          ? 'Недостаточно бипок'
          : 'Ошибка перевода'
      await ctx.reply(msg).catch(() => {})
    }
  })
