import { format, bold, type MessageContext, type CallbackQueryContext } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '@/index'
import { ensureBipkiUser, pluralizeBipki, safeReply } from '@/helpers/shared'

type CmdCtx = MessageContext<BotType> & { args: string | null }

const PREFIX = 'ch'

function renderCharity(
  userId: number,
  bankBalance: number,
  rate: number,
  displayName: string,
  lastCollectDate?: string | null,
  collected?: { totalCollected: number; payerCount: number },
): { text: string; keyboard: any } {
  const user = bipbank.getUser(userId)
  const required = bipbank.charity.getRequiredRate(user?.balance ?? 0)
  const isDefault = rate === required
  const label = isDefault ? `${rate}% (мин.)` : `${rate}%`
  const lines: string[] = [
    `🧑 ${displayName}`,
    '💰 БЛАГОТВОРИТЕЛЬНОСТЬ',
    '',
    `🏦 Банк: ${bold(String(bankBalance))} ${pluralizeBipki(bankBalance)}`,
    `📊 Ваш взнос: ${label}`,
  ]

  if (required > 1) {
    lines.push(`⚠️ Для баланса ≥ ${required - 1}K обязательная ставка ${required}%`)
  }
  if (rate > 1) {
    const boost = (rate - 1) * 5
    lines.push(`✨ Персональный буст дохода: +${boost}%`)
  }

  const coeff = bipbank.stabilizer.coeff
  if (coeff !== 1.0) lines.push(`📊 Коэффициент экономики: ×${coeff.toFixed(2)}`)

  if (lastCollectDate) {
    lines.push('')
    if (lastCollectDate === new Date().toISOString().slice(0, 10)) {
      lines.push('✅ Сегодня сбор уже прошёл')
    } else {
      lines.push(`⏳ Сбор ещё не проводился сегодня`)
    }
  }

  if (collected) {
    lines.push('')
    lines.push(`📋 Последний сбор: +${collected.totalCollected} ${pluralizeBipki(collected.totalCollected)} с ${collected.payerCount} пользователей`)
  }

  const ALL_RATES = [1, 2, 3, 5, 10] as const
  const available = ALL_RATES.filter(r => r >= required)
  const inlineKeyboard: any[][] = available.length <= 3
    ? [available.map(r => ({ text: rate === r ? `✅ ${r}%` : `${r}%`, callback_data: `${PREFIX}:rate:${r}` }))]
    : [
        available.slice(0, Math.ceil(available.length / 2)).map(r => ({ text: rate === r ? `✅ ${r}%` : `${r}%`, callback_data: `${PREFIX}:rate:${r}` })),
        available.slice(Math.ceil(available.length / 2)).map(r => ({ text: rate === r ? `✅ ${r}%` : `${r}%`, callback_data: `${PREFIX}:rate:${r}` })),
      ]

  if (user && user.balance < 100) {
    const check = bipbank.charity.canWithdraw(userId)
    if (check.allowed) {
      inlineKeyboard.push([
        { text: '25% 🏦', callback_data: `${PREFIX}:take:quarter` },
        { text: '50% 🏦', callback_data: `${PREFIX}:take:half` },
        { text: '90% 🏦', callback_data: `${PREFIX}:take:ninety` },
      ])
    } else {
      lines.push('')
      lines.push(`ℹ️ ${check.reason}`)
    }
  }

  return { text: lines.join('\n'), keyboard: { inline_keyboard: inlineKeyboard } }
}

export default (bot: BotType) => {
  bot.command("charity", async (ctx: CmdCtx) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      const charity = bipbank.charity
      const bankBalance = charity.bankBalance
      const rate = charity.getRate(userId)
      const lastCollectDate = charity.getLastCollectionDate()
      const displayName = ctx.from?.username
        ? `@${ctx.from.username}`
        : ctx.from?.firstName ?? `id${userId}`

      const { text, keyboard } = renderCharity(userId, bankBalance, rate, displayName, lastCollectDate)
      const sent = await ctx.reply(text, { reply_markup: keyboard })
      if (!sent?.id) return
    } catch {
      await safeReply(ctx, 'Ошибка')
    }
  })

  bot.on('callback_query', async (ctx: CallbackQueryContext<BotType>, next: any) => {
    const raw = ctx.update?.callback_query?.data || ctx.payload?.data
    if (typeof raw !== 'string' || !raw.startsWith(PREFIX + ':')) return next()

    try {
      await ctx.answerCallbackQuery({})
    } catch { return }

    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId) return

      const payload = raw.slice(PREFIX.length + 1)
      const parts = payload.split(':')

      if (parts[0] === 'rate') {
        const rateStr = parts[1]
        if (!rateStr) return
        const rate = parseInt(rateStr, 10)
        if (isNaN(rate) || rate < 1 || rate > 100) return
        bipbank.charity.setRate(userId, rate)
      } else if (parts[0] === 'take') {
        const fractionStr = parts[1]
        if (!fractionStr || !['quarter', 'half', 'ninety'].includes(fractionStr)) return
        const fraction = fractionStr as 'quarter' | 'half' | 'ninety'
        const taken = bipbank.charity.withdraw(userId, fraction)
        const pct = fraction === 'quarter' ? '25%' : fraction === 'half' ? '50%' : '90%'
        const who = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.firstName ?? `id${userId}`
        await ctx.editText(
          format`🧑 ${who}\n✅ Ты получил ${bold(String(taken))} ${pluralizeBipki(taken)} (${pct} от банка)`,
        )
        return
      }

      const bankBalance = bipbank.charity.bankBalance
      const rate = bipbank.charity.getRate(userId)
      const lastCollectDate = bipbank.charity.getLastCollectionDate()
      const displayName = ctx.from?.username
        ? `@${ctx.from.username}`
        : ctx.from?.firstName ?? `id${userId}`
      const { text, keyboard } = renderCharity(userId, bankBalance, rate, displayName, lastCollectDate)
      await ctx.editText(text, { reply_markup: keyboard })
    } catch {
      try { await ctx.editText('❌ Ошибка') } catch { }
    }
  })
}
