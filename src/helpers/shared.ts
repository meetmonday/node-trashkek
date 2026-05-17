import { bipbank } from '@/bipbank'

export function ensureBipkiUser(ctx: any): number | null {
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
