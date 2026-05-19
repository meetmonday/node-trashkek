import { bipbank } from '@/economy'

/**
 * Ensure user exists in BipBank and save chat/username metadata.
 *
 * Auto-creates user in the DB, records `chat_users` if in a group,
 * and persists the Telegram @username for mention resolution.
 *
 * @param ctx - Telegram command context.
 * @returns Telegram user ID, or `null` if ctx has no valid sender.
 */
export function ensureBipkiUser(ctx: any): number | null {
  const userId = ctx.from?.id
  if (!userId) return null
  if (ctx.chat?.id) bipbank.ensureChatUser(ctx.chat.id, userId)
  bipbank.setUsername(userId, ctx.from?.username || null)
  return userId
}

/**
 * Russian pluralisation for "бипки" (bipki).
 *
 * @param n - Number of bipki.
 * @returns `"бипка"` | `"бипки"` | `"бипок"`
 */
export function pluralizeBipki(n: number): string {
  const abs = Math.abs(n)
  const lastTwo = abs % 100
  if (lastTwo >= 11 && lastTwo <= 14) return 'бипок'
  const last = abs % 10
  if (last === 1) return 'бипка'
  if (last >= 2 && last <= 4) return 'бипки'
  return 'бипок'
}

/**
 * Safely reply to a Telegram context, ignoring send errors.
 *
 * Replaces the common pattern `await ctx.reply('...').catch(() => {})`.
 *
 * @param ctx - Telegram command context.
 * @param text - Message text to send.
 */
export async function safeReply(ctx: any, text: string): Promise<void> {
  try { await ctx.reply(text) } catch { /* ignore */ }
}

/**
 * Extract a display name from a Telegram user-like object.
 *
 * Falls back to `user${fallbackId}` if neither `first_name` nor `username` is set.
 *
 * @param obj - Object with optional `first_name` and `username` fields (e.g. `ctx.from`, `entity.user`).
 * @param fallbackId - Numeric ID used for the `user${id}` fallback.
 * @returns Display name string.
 */
export function userName(
  obj: { first_name?: string; username?: string } | null | undefined,
  fallbackId: number,
): string {
  return obj?.first_name || obj?.username || `user${fallbackId}`
}

/**
 * Parse a positive integer from a raw CLI-style argument string.
 *
 * @param raw - Raw argument string (e.g. `ctx.args`).
 * @returns `{ amount }` on success, or `{ amount: 0, error }` on failure.
 */
export function parsePositiveAmount(
  raw: string | undefined,
): { amount: number; error?: string } {
  if (!raw) return { amount: 0, error: 'Сумма должна быть положительным числом' }
  const amount = parseInt(raw.trim(), 10)
  if (isNaN(amount) || amount <= 0) return { amount: 0, error: 'Сумма должна быть положительным числом' }
  return { amount }
}

/**
 * Resolve a target user from a Telegram command context.
 *
 * Checks (in order):
 * 1. Reply (`ctx.replyMessage.from`)
 * 2. `text_mention` entity
 * 3. `mention` entity (`@username` resolved via `bipbank.findByUsername`)
 *
 * @param ctx - Telegram command context.
 * @returns Object with `targetId` and `targetName`, or both empty if not found.
 */
export function resolveTarget(ctx: any): { targetId: number | null; targetName: string } {
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
