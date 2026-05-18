import { format, bold, join } from 'gramio'
import { bipbank, type TopRow } from '@/economy'
import type { BotType } from '../..'

function render(rows: TopRow[], title: string, isGlobal = false) {
  if (!rows.length) return 'Топ пуст'
  const items = rows.map((r) => {
    const name = isGlobal
      ? `****${String(r.user_id).slice(-4)}`
      : r.username
        ? `${r.username}`
        : `user${r.user_id}`
    return format`${String(r.rank)}. ${name} — ${bold(String(r.balance))}`
  })
  return format`🏆 ${bold(title)}\n${join(items, '\n')}`
}

export default (bot: BotType) => {
  bot.command("top", async (ctx: any) => {
    if (ctx.chat?.type === 'private') return
    try {
      const rows = bipbank.top(ctx.chat?.id, 10)
      await ctx.reply(render(rows, 'Топ чата'))
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })

  bot.command("globaltop", async (ctx: any) => {
    try {
      await ctx.reply(render(bipbank.top(undefined, 10), 'Глобальный топ', true))
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })
}
