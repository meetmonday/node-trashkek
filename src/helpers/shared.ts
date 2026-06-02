import { bipbank } from '@/economy'

interface CtxLike {
  from?: { id?: number; username?: string }
  chat?: { id?: number }
}

interface ReplyLike {
  from?: { id: number; username?: string; first_name?: string }
}

interface EntityLike {
  type: string
  offset: number
  length: number
  user?: { id: number; username?: string }
}

interface ResolveCtxLike {
  replyMessage?: ReplyLike | null
  entities?: EntityLike[] | null
  text?: string | null
}

export function ensureBipkiUser(ctx: CtxLike): number | null {
  const userId = ctx.from?.id
  if (!userId) return null
  if (ctx.chat?.id) bipbank.ensureChatUser(ctx.chat.id, userId)
  bipbank.setUsername(userId, ctx.from?.username || null)
  return userId
}

export function pluralizeBipki(n: number): string {
  const abs = Math.abs(n)
  const lastTwo = abs % 100
  if (lastTwo >= 11 && lastTwo <= 14) return 'бипок'
  const last = abs % 10
  if (last === 1) return 'бипка'
  if (last >= 2 && last <= 4) return 'бипки'
  return 'бипок'
}

export async function safeReply(ctx: { reply: (text: string) => Promise<unknown> }, text: string): Promise<void> {
  try { await ctx.reply(text) } catch { /* ignore */ }
}

export function userName(
  obj: { firstName?: string; first_name?: string; username?: string } | null | undefined,
  fallbackId: number,
): string {
  return obj?.firstName || obj?.first_name || obj?.username || `user${fallbackId}`
}

export function parsePositiveAmount(
  raw: string | undefined,
): { amount: number; error?: string } {
  if (!raw) return { amount: 0, error: 'Сумма должна быть положительным числом' }
  const amount = parseInt(raw.trim(), 10)
  if (isNaN(amount) || amount <= 0) return { amount: 0, error: 'Сумма должна быть положительным числом' }
  return { amount }
}

export function resolveTarget(ctx: ResolveCtxLike): { targetId: number | null; targetName: string } {
  if (ctx.replyMessage?.from) {
    return {
      targetId: ctx.replyMessage.from.id,
      targetName: userName(ctx.replyMessage.from, ctx.replyMessage.from.id),
    }
  }

  if (ctx.entities) {
    for (const e of ctx.entities) {
      if (e.type === 'text_mention' && e.user) {
        return {
          targetId: e.user.id,
          targetName: userName(e.user, e.user.id),
        }
      }
      if (e.type === 'mention') {
        const mention = ctx.text
          ?.slice(e.offset, e.offset + e.length)
          ?.replace('@', '')
        if (mention) {
          const found = bipbank.findByUsername(mention)
          if (found !== null) {
            return { targetId: found, targetName: `@${mention}` }
          }
        }
      }
    }
  }

  return { targetId: null, targetName: '' }
}

/**
 * Randomly distribute `totalAmount` among a subset of `userIds`.
 *
 * Shuffles the candidate list, picks up to `count` recipients, and assigns
 * random positive shares that sum to `totalAmount`. Returns an empty array
 * if fewer than 2 candidates are available.
 *
 * Used by `/rain` and `/ngbet` for prize distribution.
 *
 * @param userIds - Candidate user IDs to pick from.
 * @param totalAmount - Total amount to distribute.
 * @param count - Desired number of recipients (capped to available).
 * @returns Array of `{ userId, amount }` pairs, or `[]` if impossible.
 */
export function randomlyDistribute(
  userIds: number[],
  totalAmount: number,
  count: number,
): Array<{ userId: number; amount: number }> {
  if (userIds.length < 2 || totalAmount <= 0 || count < 2) return []

  const shuffled = userIds.slice().sort(() => Math.random() - 0.5)
  const pick = shuffled.slice(0, Math.min(count, shuffled.length))
  const n = pick.length

  const shares = new Array(n).fill(0)
  let rem = totalAmount
  for (let i = 0; i < n - 1; i++) {
    const max = Math.max(1, rem - (n - i - 1))
    const s = Math.min(Math.floor(Math.random() * max) + 1, rem)
    shares[i] = s
    rem -= s
  }
  shares[n - 1] = Math.max(0, rem)

  return pick.map((id, i) => ({ userId: id, amount: shares[i]! }))
}
