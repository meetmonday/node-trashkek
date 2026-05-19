import { Database } from 'bun:sqlite'
import { ensureUser } from './sql'
import { TX_TYPE } from './types'
import type { DbApi } from './sql'

export interface PoolStatus {
  total: number
  participants: Array<{ userId: number; amount: number }>
}

export interface PoolContribution {
  chatId: number
  poolId: string
  userId: number
  amount: number
}

export class PoolManager {
  constructor(
    private db: DbApi,
    private rawDb: Database,
  ) {}

  contribute(chatId: number, poolId: string, userId: number, amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive')
    ensureUser(this.rawDb, userId)

    this.db.transaction(() => {
      const bal = this.db.balance.of(userId)
      if (bal < amount) throw new Error('Insufficient balance')

      this.db.balance.sub(userId, amount)
      this.db.transactions.insert({ from_user_id: userId, amount, type: TX_TYPE.gambled, description: `pool:${poolId}` })
      this.db.pools.upsertContribution(chatId, poolId, userId, amount)
    })
  }

  refund(chatId: number, poolId: string): number {
    return this.db.transaction(() => {
      const rows = this.db.pools.participants(chatId, poolId)
      if (rows.length === 0) return 0

      for (const r of rows) {
        ensureUser(this.rawDb, r.user_id)
        this.db.balance.add(r.user_id, r.amount)
        this.db.transactions.insert({ to_user_id: r.user_id, amount: r.amount, type: TX_TYPE.gambled, description: `pool refund:${poolId}` })
      }

      this.db.pools.delete(chatId, poolId)
      return rows.reduce((s, r) => s + r.amount, 0)
    })
  }

  award(chatId: number, poolId: string, winnerId: number): number {
    return this.db.transaction(() => {
      const total = this.db.pools.totalRaw(chatId, poolId)
      if (total <= 0) throw new Error('Pool is empty')

      ensureUser(this.rawDb, winnerId)
      this.db.balance.add(winnerId, total)
      this.db.transactions.insert({ to_user_id: winnerId, amount: total, type: TX_TYPE.gambled, description: `pool win:${poolId}` })

      this.db.pools.delete(chatId, poolId)
      return total
    })
  }

  split(
    chatId: number,
    poolId: string,
    recipients: Array<{ userId: number; amount: number }>,
  ): { distributed: number; fee: number } {
    return this.db.transaction(() => {
      const total = this.db.pools.totalRaw(chatId, poolId)
      if (total <= 0) throw new Error('Pool is empty')
      if (recipients.length === 0) throw new Error('Recipients list is empty')

      const distributed = recipients.reduce((s, r) => s + r.amount, 0)
      const fee = total - distributed

      for (const r of recipients) {
        ensureUser(this.rawDb, r.userId)
        this.db.balance.add(r.userId, r.amount)
        this.db.transactions.insert({ to_user_id: r.userId, amount: r.amount, type: TX_TYPE.gambled, description: `pool split:${poolId}` })
      }

      if (fee > 0) {
        this.db.transactions.insert({ from_user_id: null, amount: fee, type: TX_TYPE.fee, description: `pool fee:${poolId}`, systemDescription: false })
      }

      this.db.pools.delete(chatId, poolId)
      return { distributed, fee }
    })
  }

  burn(chatId: number, poolId: string): number {
    return this.db.transaction(() => {
      const total = this.db.pools.totalRaw(chatId, poolId)
      if (total <= 0) return 0

      this.db.transactions.insert({ from_user_id: null, amount: total, type: TX_TYPE.fee, description: `pool burn:${poolId}`, systemDescription: false })
      this.db.pools.delete(chatId, poolId)
      return total
    })
  }

  status(chatId: number, poolId: string): PoolStatus | null {
    const participants = this.db.pools.participants(chatId, poolId)
    if (participants.length === 0) return null

    return {
      total: participants.reduce((s, p) => s + p.amount, 0),
      participants: participants.map((p) => ({ userId: p.user_id, amount: p.amount })),
    }
  }

  restore(): PoolContribution[] {
    const rows = this.db.pools.all()
    return rows.map((r) => ({
      chatId: r.chat_id,
      poolId: r.pool_id,
      userId: r.user_id,
      amount: r.amount,
    }))
  }
}
