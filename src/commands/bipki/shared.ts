import { bipbank } from '@/bipbank'

export function ensureBipkiUser(ctx: any): number | null {
  const userId = ctx.from?.id
  if (!userId) return null
  if (ctx.chat?.id) bipbank.ensureChatUser(ctx.chat.id, userId)
  bipbank.setUsername(userId, ctx.from?.username || null)
  return userId
}
