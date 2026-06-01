import { bipbank, TX_TYPE } from '@/economy'
import type { BotType } from '@/index'
import { ensureBipkiUser, pluralizeBipki, userName } from '@/helpers/shared'
import { sleep, gameKey, deleteDiceMsg } from '@/helpers/games'

const MAX_BET = 500
const SESSION_TTL = 60000
const HEIST_PREFIX = 'hb'

interface HeistSession {
  chatId: number
  messageId: number
  userId: number
  userName: string
  bet: number
  stages: string[]
  stage1MsgId?: number
  stage2MsgId?: number
  startedAt: number
}

const sessions = new Map<string, HeistSession>()

const DICE_EMOJI = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'] as const
const DICE_NAMES = ['', 'Единица', 'Двойка', 'Тройка', 'Четвёрка', 'Пятёрка', 'Шестёрка'] as const

const COIN_SIDES: Record<string, { emoji: string; name: string }> = {
  s3h: { emoji: '🦅', name: 'Орёл' },
  s3t: { emoji: '🌿', name: 'Решка' },
}

function fmtTime(ms: number): string {
  if (ms <= 0) return '0 мин'
  const min = Math.ceil(ms / 60000)
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}ч ${m}мин` : `${h}ч`
}

function renderHeist(s: HeistSession, vault: number, final?: { reward: number; bet: number; vaultLeft: number; cooldown: number; success: boolean }): string {
  const lines: string[] = []

  if (final) {
    lines.push(final.success ? '🕵️‍♂️ ВЗЛОМ СЕЙФА УДАЛСЯ!' : '🚨 ТРЕВОГА! Охрана прибыла...')
    lines.push('')
  } else {
    lines.push('🕵️‍♂️ ВЗЛОМ СЕЙФА')
    lines.push('')
  }

  lines.push(`🏦 Банк: ${vault} ${pluralizeBipki(vault)}`)
  if (s.bet > 0) {
    const chanceBonus = Math.min(Math.floor(s.bet / 100), 2) * 17
    if (chanceBonus > 0) {
      lines.push(`💰 Залог: ${s.bet} ${pluralizeBipki(s.bet)} (шанс +${chanceBonus}%)`)
    } else {
      lines.push(`💰 Залог: ${s.bet} ${pluralizeBipki(s.bet)}`)
    }
  }
  lines.push(`👤 Взломщик: ${s.userName}`)
  lines.push('')

  if (s.stages.length > 0) {
    lines.push('📋 Лог ограбления:')
    for (const st of s.stages) {
      lines.push(st)
    }
    lines.push('')
  }

  if (final) {
    if (final.success) {
      const total = final.reward + final.bet
      lines.push(`💰 Добыча: +${final.reward} ${pluralizeBipki(final.reward)}`)
      if (final.bet > 0) {
        lines.push(`🔄 Возврат залога: +${final.bet} ${pluralizeBipki(final.bet)}`)
      }
      lines.push(`💵 Итого: +${total} ${pluralizeBipki(total)}`)
      lines.push('')
      lines.push(`🏦 Остаток в банке: ${final.vaultLeft} ${pluralizeBipki(final.vaultLeft)}`)
    } else {
      if (final.bet > 0) {
        lines.push(`💸 Залог сгорел: ${final.bet} ${pluralizeBipki(final.bet)}`)
        lines.push('')
      }
      lines.push(`🏦 Остаток в банке: ${final.vaultLeft} ${pluralizeBipki(final.vaultLeft)}`)
    }
    lines.push(`⏳ Кулдаун: ${fmtTime(final.cooldown)}`)
  }

  return lines.join('\n')
}

function stageKeyboard(stage: 1 | 2 | 3): any {
  if (stage === 1) {
    return {
      inline_keyboard: [
        [{ text: '🎲 Обход охраны', callback_data: `${HEIST_PREFIX}:s1` }],
        [{ text: '❌ Отмена', callback_data: `${HEIST_PREFIX}:cancel` }],
      ],
    }
  }
  if (stage === 2) {
    return {
      inline_keyboard: [
        [{ text: '🎰 Взлом сейфа', callback_data: `${HEIST_PREFIX}:s2` }],
        [{ text: '❌ Отмена', callback_data: `${HEIST_PREFIX}:cancel` }],
      ],
    }
  }
  return {
    inline_keyboard: [
      [
        { text: '🦅 Орёл', callback_data: `${HEIST_PREFIX}:s3h` },
        { text: '🌿 Решка', callback_data: `${HEIST_PREFIX}:s3t` },
      ],
    ],
  }
}

export default (bot: BotType) => {
  async function refundBet(session: HeistSession): Promise<void> {
    if (session.bet <= 0) return
    bipbank.deposit(session.userId, session.bet, TX_TYPE.gambled, 'Heist refund')
  }

  async function cleanupSession(session: HeistSession): Promise<void> {
    sessions.delete(gameKey(session.chatId, session.messageId))
    bipbank.heist.releaseLock()
    await refundBet(session)
  }

  async function failHeist(ctx: any, session: HeistSession, line: string): Promise<void> {
    const heist = bipbank.heist
    const vault = heist.vaultBalance
    if (session.bet > 0) heist.addToVault(session.bet)
    session.stages.push(line)
    heist.setCooldown(session.userId, false)
    heist.releaseLock()
    const vaultAfter = vault + session.bet
    await ctx.editText(
      renderHeist(session, vaultAfter, {
        reward: 0, bet: session.bet, vaultLeft: vaultAfter,
        cooldown: heist.getCooldown(session.userId), success: false,
      }),
    )
    sessions.delete(gameKey(session.chatId, session.messageId))
  }

  bot.command("crack", async (ctx: any) => {
    try {
      const userId = ensureBipkiUser(ctx)
      if (!userId || !ctx.chat?.id) return

      const raw = ctx.args?.trim()
      let bet = 0
      if (raw) {
        const n = parseInt(raw, 10)
        if (isNaN(n) || n < 0) {
          await ctx.reply('Укажи положительную сумму залога или 0. /crack [N]')
          return
        }
        if (n > MAX_BET) {
          await ctx.reply(`Максимальный залог — ${MAX_BET} бипок`)
          return
        }
        bet = n
      }

      const heist = bipbank.heist
      if (heist.isLocked) {
        await ctx.reply('🔒 Банк сейчас грабят! Подожди своей очереди.')
        return
      }

      const cooldownMs = heist.getCooldown(userId)
      if (cooldownMs > 0) {
        await ctx.reply(`⏳ Нельзя грабить так часто. Подожди ещё ${fmtTime(cooldownMs)}.`)
        return
      }

      if (bet > 0 && bipbank.balance(userId) < bet) {
        await ctx.reply(`Недостаточно бипок для залога (нужно ${bet})`)
        return
      }

      if (bet > 0) {
        if (!bipbank.withdraw(userId, bet, TX_TYPE.gambled, 'Heist bet')) {
          await ctx.reply('Ошибка при списании залога')
          return
        }
      }

      if (!heist.acquireLock(userId)) {
        if (bet > 0) bipbank.deposit(userId, bet, TX_TYPE.gambled, 'Heist refund')
        await ctx.reply('🔒 Банк сейчас грабят! Попробуй позже.')
        return
      }

      const name = userName(ctx.from, userId)
      const vault = heist.vaultBalance

      const sent = await ctx.reply(
        renderHeist({ chatId: ctx.chat.id, messageId: 0, userId, userName: name, bet, stages: [], startedAt: Date.now() }, vault),
        { reply_markup: stageKeyboard(1) },
      )
      const msgId = sent?.id
      if (!msgId) {
        if (bet > 0) bipbank.deposit(userId, bet, TX_TYPE.gambled, 'Heist refund')
        heist.releaseLock()
        return
      }

      sessions.set(gameKey(ctx.chat.id, msgId), {
        chatId: ctx.chat.id,
        messageId: msgId,
        userId,
        userName: name,
        bet,
        stages: [],
        startedAt: Date.now(),
      })
    } catch {
      await ctx.reply('Ошибка').catch(() => {})
    }
  })

  bot.on('callback_query', async (ctx: any, next: any) => {
    const raw = ctx.update?.callback_query?.data || ctx.payload?.data
    if (typeof raw !== 'string' || !raw.startsWith(`${HEIST_PREFIX}:`)) return next()

    try { await ctx.answerCallbackQuery({}) } catch { return }

    try {
      const action = raw.slice(HEIST_PREFIX.length + 1) as 's1' | 's2' | 's3h' | 's3t' | 'cancel'
      if (!['s1', 's2', 's3h', 's3t', 'cancel'].includes(action)) return

      const chatId = ctx.chatId
      const msgId = ctx.message?.id
      if (!chatId || !msgId) return

      const key = gameKey(chatId, msgId)
      const session = sessions.get(key)
      if (!session) return

      const userId = ensureBipkiUser(ctx)
      if (!userId || userId !== session.userId) return

      if (Date.now() - session.startedAt > SESSION_TTL) {
        sessions.delete(key)
        if (bipbank.heist.lockUserId === session.userId) {
          bipbank.heist.releaseLock()
        }
        if (session.bet > 0) {
          bipbank.deposit(session.userId, session.bet, TX_TYPE.gambled, 'Heist refund')
        }
        return
      }

      const heist = bipbank.heist

      if (action === 'cancel') {
        await deleteDiceMsg(bot, chatId, session.stage2MsgId)
        await deleteDiceMsg(bot, chatId, session.stage1MsgId)
        await cleanupSession(session)
        const vault = heist.vaultBalance
        await ctx.editText(`❌ Взлом отменён\n\n${renderHeist(session, vault)}`)
        return
      }

      if (action === 's1') {
        let diceValue: number | undefined
        try {
          const diceMsg = await bot.api.sendDice({ chat_id: chatId, emoji: '🎲' })
          diceValue = diceMsg.dice?.value
          session.stage1MsgId = diceMsg.message_id
        } catch {
          await cleanupSession(session)
          await ctx.editText('❌ Ошибка связи с охраной. Взлом провален.')
          return
        }

        if (!diceValue || diceValue < 1 || diceValue > 6) {
          await deleteDiceMsg(bot, chatId, session.stage1MsgId)
          await cleanupSession(session)
          await ctx.editText('❌ Ошибка связи с охраной. Взлом провален.')
          return
        }

        await sleep(5000)

        const bonus = Math.min(Math.floor(session.bet / 100), 2)
        const threshold = 3 - bonus
        const success = diceValue > threshold

        const line = `🎲 Обход охраны: ${DICE_EMOJI[diceValue]} ${DICE_NAMES[diceValue]} — ${success ? 'Успех ✅' : 'Провал ❌'}`

        if (!success) {
          await deleteDiceMsg(bot, chatId, session.stage1MsgId)
          await failHeist(ctx, session, line)
          return
        }

        session.stages.push(line)
        await ctx.editText(
          renderHeist(session, heist.vaultBalance),
          { reply_markup: stageKeyboard(2) },
        )
        return
      }

      if (action === 's2') {
        await deleteDiceMsg(bot, chatId, session.stage1MsgId)

        let diceValue: number | undefined
        try {
          const diceMsg = await bot.api.sendDice({ chat_id: chatId, emoji: '🎰' })
          diceValue = diceMsg.dice?.value
          session.stage2MsgId = diceMsg.message_id
        } catch {
          await cleanupSession(session)
          await ctx.editText('❌ Сейф заклинило. Взлом провален.')
          return
        }

        if (!diceValue) {
          await deleteDiceMsg(bot, chatId, session.stage2MsgId)
          await cleanupSession(session)
          await ctx.editText('❌ Сейф заклинило. Взлом провален.')
          return
        }

        await sleep(2000)

        const n = diceValue - 1
        const a = n & 3
        const b = (n >> 2) & 3
        const c = (n >> 4) & 3
        const syms = ['🎰', '🍇', '🍋', '7️⃣']
        const names = ['BAR', 'Виноград', 'Лимон', 'Семёрка']

        let slotSuccess: boolean
        let winName: string

        if (a === b && b === c) {
          slotSuccess = true
          winName = `Три ${names[a]}!`
        } else if (a === b || b === c || a === c) {
          slotSuccess = true
          const pairVal = a === b ? a : c
          winName = `Пара ${names[pairVal]}`
        } else {
          slotSuccess = false
          winName = 'Мимо'
        }

        const line = `🎰 Взлом сейфа: ${syms[a]} ${syms[b]} ${syms[c]} — ${slotSuccess ? 'Успех ✅' : 'Провал ❌'} (${winName})`

        if (!slotSuccess) {
          await deleteDiceMsg(bot, chatId, session.stage2MsgId)
          await failHeist(ctx, session, line)
          return
        }

        session.stages.push(line)
        await ctx.editText(
          renderHeist(session, heist.vaultBalance),
          { reply_markup: stageKeyboard(3) },
        )
        return
      }

      if (action === 's3h' || action === 's3t') {
        await deleteDiceMsg(bot, chatId, session.stage2MsgId)

        const side = COIN_SIDES[action]!
        const won = Math.random() < 0.5
        const actual = won ? side : COIN_SIDES[action === 's3h' ? 's3t' : 's3h']!

        const stagesPassed = session.stages.length + 1
        const vault = heist.vaultBalance
        const fullReward = Math.min(heist.calculateReward(vault, stagesPassed), heist.payoutCeiling(userId))
        const reward = won ? fullReward : Math.floor(fullReward * 0.75)
        const paid = heist.takeFromVault(reward)
        const vaultBurned = heist.burnVaultReserve()

        await refundBet(session)
        bipbank.deposit(userId, paid, TX_TYPE.gambled, 'Heist reward')

        const line = `🦅 Замести следы: ${side.emoji} ${side.name} → ${actual.emoji} ${actual.name} — ${won ? 'Успех ✅' : 'Частично 👎'}`
        if (vaultBurned > 0) session.stages.push(`🔥 ${vaultBurned} бипок сгорело в сейфе`)
        session.stages.push(line)

        heist.setCooldown(userId, true)
        heist.releaseLock()

        await ctx.editText(
          renderHeist(session, vault, {
            reward: paid,
            bet: session.bet,
            vaultLeft: heist.vaultBalance,
            cooldown: heist.getCooldown(userId),
            success: true,
          }),
        )
        sessions.delete(key)
        return
      }
    } catch {
      /* silent */
    }
  })
}
