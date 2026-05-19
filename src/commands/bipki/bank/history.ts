import { format, bold, join } from 'gramio'
import { bipbank, type TransactionRow } from '@/economy'
import timeAgo from '@/helpers/timeAgo'
import type { BotType } from '../../..'
import { ensureBipkiUser, safeReply } from '@/helpers/shared'

const EMOJI: Record<string, string> = {
  daily: '🎁', transfer: '💸', burn: '🔥',
  rain: '🌧', work: '💼', admin: '⚙️', fee: '💳',
}

function fmt(txs: TransactionRow[], uid: number) {
  if (!txs.length) return '📜 История пуста'
  const items = txs.map((t) => {
    const e = EMOJI[t.type] || '📄'
    const ts = new Date(t.created_at + 'Z').getTime() / 1000
    const d = timeAgo(ts, true) as string
    const isIn = t.to_user_id === uid
    const isOut = t.from_user_id === uid

    if (t.type === 'transfer' && isIn)
      return format`${e} +${bold(String(t.amount))} ← user${String(t.from_user_id)} — ${d}`
    if (t.type === 'transfer' && isOut)
      return format`${e} -${bold(String(t.amount))} → user${String(t.to_user_id)} — ${d}`
    if (isIn)
      return format`${e} +${bold(String(t.amount))} — ${t.description || t.type} — ${d}`
    return format`${e} -${bold(String(t.amount))} — ${t.description || t.type} — ${d}`
  })
  return format`📜 ${bold(`Последние ${txs.length} операций:`)}\n${join(items, '\n')}`
}

export default (bot: BotType) =>
  bot.command("history", async (ctx: any) => {
    try {
      const uid = ensureBipkiUser(ctx)
      if (!uid) return

      let limit = 5
      if (ctx.args) {
        const p = parseInt(ctx.args.trim(), 10)
        if (!isNaN(p) && p > 0) limit = p
      }

      await ctx.reply(fmt(bipbank.history(uid, limit), uid))
    } catch {
      await safeReply(ctx, 'Ошибка')
    }
  })
