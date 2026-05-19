import { pluralizeBipki } from './shared'

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export const MIN_BET = 10
export const MAX_BET = 500
export const MAX_LOG = 20

export interface GameBase {
  chatId: number
  messageId: number
  creatorId: number
  creatorName: string
  bet: number
  closed: boolean
}

export interface GameLogEntry {
  name: string
  display: string
  winName: string
  bet: number
  payout: number
}

export function gameKey(chatId: number, messageId: number): string {
  return `${chatId}:${messageId}`
}

export function parseGameBet(raw: string | undefined): { bet: number; error?: string } {
  if (!raw) return { bet: 0, error: 'Укажи ставку' }
  const bet = parseInt(raw, 10)
  if (isNaN(bet) || bet <= 0) return { bet: 0, error: 'Ставка должна быть положительным числом' }
  if (bet < MIN_BET) return { bet: 0, error: `Минимальная ставка — ${MIN_BET} бипок` }
  if (bet > MAX_BET) return { bet: 0, error: `Максимальная ставка — ${MAX_BET} бипок` }
  return { bet }
}

export function gameKeyboard(prefix: string, spinText: string, spinEmoji: string): any {
  return {
    inline_keyboard: [
      [{ text: `${spinEmoji} ${spinText}`, callback_data: `${prefix}:spin` }],
      [
        { text: '✖️ x2', callback_data: `${prefix}:double` },
        { text: '➗ x0.5', callback_data: `${prefix}:halve` },
        { text: '🏁 Закрыть', callback_data: `${prefix}:close` },
      ],
    ],
  }
}

export function gameTotalNet(log: GameLogEntry[]): number {
  return log.reduce((acc, e) => acc + e.payout - e.bet, 0)
}

export function renderGameLogLines(log: GameLogEntry[], creatorName?: string): string[] {
  if (log.length === 0) return []
  const lines = ['📋 Лог (последние 5):']
  for (const entry of log.slice(-5)) {
    const net = entry.payout - entry.bet
    const prefix = creatorName && entry.name === creatorName ? '' : `${entry.name}: `
    if (net > 0) {
      lines.push(`${prefix}${entry.display} — ${entry.winName} ✅ +${net}`)
    } else if (net === 0) {
      lines.push(`${prefix}${entry.display} — ${entry.winName} 🔄`)
    } else {
      lines.push(`${prefix}${entry.display} — ${entry.winName} ❌`)
    }
  }
  return lines
}

export function renderGameHeader(emoji: string, title: string, g: GameBase, suffix?: string, log?: GameLogEntry[]): string[] {
  const lines = [
    `${emoji} ${title} | Ставка: ${g.bet} ${pluralizeBipki(g.bet)}${suffix ? ` | ${suffix}` : ''}`,
    `Создатель: ${g.creatorName}`,
    '',
  ]
  if (g.closed) {
    lines.push('🚫 Игра завершена')
    if (log && log.length > 0) {
      const net = gameTotalNet(log)
      lines.push(`💰 Игрок разбогател на ${net >= 0 ? '+' : ''}${net} бипок`)
    }
    lines.push('')
  }
  return lines
}

export function newBet(bet: number, action: 'double' | 'halve'): number {
  return action === 'double'
    ? Math.min(bet * 2, MAX_BET)
    : Math.max(Math.floor(bet / 2), MIN_BET)
}

export async function deleteDiceMsg(bot: any, chatId: number, msgId: number | undefined): Promise<void> {
  if (!msgId) return
  try { await bot.api.deleteMessage({ chat_id: chatId, message_id: msgId }) } catch { /* ignore */ }
}
