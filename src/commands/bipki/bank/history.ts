import { format, bold, join, type MessageContext } from 'gramio'
import { bipbank, TX_TYPE, txTypeName, type TransactionRow } from '@/economy'
import timeAgo from '@/helpers/timeAgo'
import type { BotType } from '../../..'
import { ensureBipkiUser, safeReply } from '@/helpers/shared'

type CmdCtx = MessageContext<BotType> & { args: string | null }

const TYPE_EMOJI: Record<number, string> = {
  [TX_TYPE.daily]: '🎁',
  [TX_TYPE.transfer]: '💸',
  [TX_TYPE.burn]: '🔥',
  [TX_TYPE.rain]: '🌧',
  [TX_TYPE.work]: '💼',
  [TX_TYPE.admin]: '⚙️',
  [TX_TYPE.fee]: '💳',
  [TX_TYPE.gambled]: '🪙',
}

function fmt(txs: TransactionRow[], uid: number) {
  if (!txs.length) return '📜 История пуста'

  const feeByParent = new Map<number, number>()
  const skipIds = new Set<number>()

  for (const t of txs) {
    if (t.type === TX_TYPE.fee && t.parent_tx_id) {
      feeByParent.set(t.parent_tx_id, (feeByParent.get(t.parent_tx_id) ?? 0) + t.amount)
      skipIds.add(t.id)
    }
  }

  const items = txs.map((t) => {
    if (skipIds.has(t.id)) return null

    const e = TYPE_EMOJI[t.type] || '📄'
    const d = timeAgo(t.created_at, true) as string
    const isIn = t.to_user_id === uid
    const isOut = t.from_user_id === uid
    const label = t.description || txTypeName(t.type)
    const feeAmount = feeByParent.get(t.id)
    const feeSuffix = feeAmount ? format` (комиссия: ${String(feeAmount)})` : ''

    if (t.type === TX_TYPE.transfer && isIn)
      return format`${e} +${bold(String(t.amount))} ← user${String(t.from_user_id)} — ${d}${feeSuffix}`
    if (t.type === TX_TYPE.transfer && isOut)
      return format`${e} -${bold(String(t.amount))} → user${String(t.to_user_id)} — ${d}${feeSuffix}`
    if (isIn)
      return format`${e} +${bold(String(t.amount))} — ${label} — ${d}${feeSuffix}`
    return format`${e} -${bold(String(t.amount))} — ${label} — ${d}${feeSuffix}`
  })

  const visible = items.filter(Boolean) as any[]
  return format`📜 ${bold(`Последние ${visible.length} операций:`)}\n${join(visible, '\n')}`
}

export default (bot: BotType) =>
  bot.command("history", async (ctx: CmdCtx) => {
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
