import { format, bold, join } from 'gramio'
import { bipbank } from '@/economy'
import type { BotType } from '../../..'
import { ensureBipkiUser, pluralizeBipki } from '@/helpers/shared'

interface NgBetState {
  participants: Map<number, number>
  total: number
}

const states = new Map<number, NgBetState>()

function getState(chatId: number): NgBetState {
  let s = states.get(chatId)
  if (!s) {
    s = { participants: new Map(), total: 0 }
    states.set(chatId, s)
  }
  return s
}

function loadPools(): void {
  const rows = bipbank.pools.restore()
  for (const row of rows) {
    if (row.poolId !== 'ngbet') continue
    const s = getState(row.chatId)
    s.participants.set(row.userId, row.amount)
    s.total += row.amount
  }
}
loadPools()

const KILL_PATTERNS = [
  /^Раздался выстрел — и (.+?) больше с нами$/,
  /^Барабан провернулся, курок щёлкнул\.\.\. (.+?) выбывает$/,
  /^Пуля нашла свою жертву — это был (.+?)$/,
  /^Кровь, порох и тишина\.\.\. (.+?) проиграл$/,
  /^(.+?) решил, что жил слишком долго$/,
  /^В этот раз не повезло (.+?)$/,
  /^На этот раз смерть выбрала (.+?)$/,
  /^Роковой выстрел для (.+?)$/,
  /^(.+?) больше не ответит$/,
  /^Прощай, (.+?), мы тебя запомним\.\.\.$/,
  /^Игра окончена для (.+?)$/,
  /^Момент истины для (.+?) оказался последним$/,
  /^(.+?) получил билет в один конец\.?$/,
]

const NUKE_PATTERNS = [
  /^Щёлк — и внезапно комната превратилась в эпицентр ядерного гриба\. В револьере оказалась атомная пуля$/,
  /^\.\.\.от группы смельчаков остался только радиоактивный след\. Видимо, кто-то подсунул в барабан не ту пулю$/,
  /^Ккомната наполнилась ярким светом\.\.\. Все игроки мгновенно испарились\. Кто-то явно жульничал с боеприпасами$/,
]

function extractKilledUsername(text: string): string | null {
  for (const p of KILL_PATTERNS) {
    const m = text.match(p)
    if (m) return m[1]!.trim()
  }
  return null
}

function isNuke(text: string): boolean {
  return NUKE_PATTERNS.some((p) => p.test(text))
}

function distributeRain(
  chatId: number,
  state: NgBetState,
): Array<{ userId: number; amount: number }> {
  const others = bipbank
    .getChatUserIds(chatId)
    .filter((id: number) => !state.participants.has(id))

  if (others.length < 3) return []

  const shuffled = others.sort(() => Math.random() - 0.5)
  const count = Math.min(5, shuffled.length)
  const pick = shuffled.slice(0, count)

  const shares = new Array(count).fill(0)
  let rem = state.total
  for (let i = 0; i < count - 1; i++) {
    const max = rem - (count - i - 1)
    const s = Math.floor(Math.random() * Math.max(1, max)) + 1
    shares[i] = Math.min(s, rem)
    rem -= shares[i]!
  }
  shares[count - 1] = Math.max(0, rem)

  return pick.map((id: number, i: number) => ({
    userId: id,
    amount: shares[i]!,
  }))
}

export default (bot: BotType) => {
  bot.command('ngbet', async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      const chatId = ctx.chat?.id
      if (!userId || !chatId || ctx.chat?.type === 'private') {
        await ctx.reply('🎰 /ngbet работает только в группах')
        return
      }

      const state = getState(chatId)
      const args = ctx.args?.trim()

      if (!args) {
        const userBet = state.participants.get(userId) || 0
        await ctx.reply(format`${bold('🎰 NaganBet')}
Твоя ставка: ${bold(String(userBet))} ${pluralizeBipki(userBet)}
Общий банк: ${bold(String(state.total))} ${pluralizeBipki(state.total)}`)
        return
      }

      if (args.toLowerCase() === 'cancel') {
        if (state.total === 0) {
          await ctx.reply('🎰 Нет активных ставок для отмены')
          return
        }
        bipbank.pools.refund(chatId, 'ngbet')
        states.delete(chatId)
        await ctx.reply(format`${bold('🎰 NaganBet')} — все ставки возвращены`)
        return
      }

      const amount = parseInt(args, 10)
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('Сумма должна быть положительным числом')
        return
      }

      try {
        bipbank.pools.contribute(chatId, 'ngbet', userId, amount)
        const userBet = (state.participants.get(userId) || 0) + amount
        state.participants.set(userId, userBet)
        state.total += amount

        await ctx.reply(format`${bold('🎰 NaganBet')}
${ctx.from?.first_name || ctx.from?.username || `user${userId}`} поставил ${bold(String(amount))} ${pluralizeBipki(amount)}
Общий банк: ${bold(String(state.total))} ${pluralizeBipki(state.total)}`)
      } catch (e: any) {
        const msg =
          e?.message === 'Insufficient balance'
            ? 'Недостаточно бипок'
            : 'Ошибка'
        await ctx.reply(msg)
      }
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })

  bot.on('message', async (ctx: any, next: any) => {
    try {
      if(ctx.from.username !== 'naganbot' && ctx.from.username !== 'itisdj_bot') return next()
      const text = ctx.text || ctx.caption || ''
      const chatId = ctx.chat?.id
      if (!chatId || !text) return

      const state = states.get(chatId)
      if (!state || state.total <= 0) return

      if (isNuke(text)) {
        const recipients = distributeRain(chatId, state)
        if (recipients.length < 3) {
          await ctx.reply(format`${bold('🎰 NaganBet')}
☢️ Все проиграли, но нет получателей для дождя (нужно ≥3). Банк сгорает.`)
          return
        }
        const { distributed, fee } = bipbank.pools.split(chatId, 'ngbet', recipients)
        states.delete(chatId)

        const items = recipients.map((r) => {
          const u = bipbank.getUser(r.userId)
          const name = u.username || `user${r.userId}`
          return `${name}: ${bold(String(r.amount))}`
        })

        let msg = format`${bold('🎰 NaganBet')}
☢️ Все проиграли — банк уходит в дождь!
${join(items, '\n')}`

        if (fee > 0) {
          msg = format`${msg}\n🔥 ${bold(String(fee))} ${pluralizeBipki(fee)} сгорело`
        }

        await ctx.reply(msg)
        return
      }

      const killedUsername = extractKilledUsername(text)
      if (!killedUsername) return

      const killedUserId = bipbank.findByUsername(killedUsername.replace(/^@/, ''))

      if (killedUserId) {
        const total = bipbank.pools.award(chatId, 'ngbet', killedUserId)
        states.delete(chatId)
        await ctx.reply(format`${bold('🎰 NaganBet')}
💀 ${killedUsername} забирает банк — ${bold(String(total))} ${pluralizeBipki(total)}!`)
      } else {
        const recipients = distributeRain(chatId, state)
        if (recipients.length < 3) {
          await ctx.reply(format`${bold('🎰 NaganBet')}
💀 ${killedUsername} не в бипках, но нет получателей для дождя (нужно ≥3). Банк сгорает.`)
          return
        }
        const { distributed, fee } = bipbank.pools.split(chatId, 'ngbet', recipients)
        states.delete(chatId)

        const items = recipients.map((r) => {
          const u = bipbank.getUser(r.userId)
          const name = u.username || `user${r.userId}`
          return `${name}: ${bold(String(r.amount))}`
        })

        let msg = format`${bold('🎰 NaganBet')}
💀 ${killedUsername} не в бипках — банк уходит в дождь!
${join(items, '\n')}`

        if (fee > 0) {
          msg = format`${msg}\n🔥 ${bold(String(fee))} ${pluralizeBipki(fee)} сгорело`
        }

        await ctx.reply(msg)
      }
    } catch {
      /* silent */
    }
  })
}
