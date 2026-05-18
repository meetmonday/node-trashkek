import { Database } from 'bun:sqlite'
import type { TxType } from './types'

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
    private db: Database,
    private deposit: (to: number, amount: number, type: TxType, description?: string) => void,
    private ensureUser: (userId: number) => void,
  ) {}

  contribute(chatId: number, poolId: string, userId: number, amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive')
    this.ensureUser(userId)

    this.db.transaction(() => {
      const row = this.db.query(
        'SELECT balance FROM users WHERE user_id = ?',
      ).get(userId) as { balance: number } | undefined

      if (!row || row.balance < amount) {
        throw new Error('Insufficient balance')
      }

      this.db.run(
        'UPDATE users SET balance = balance - ?, updated_at = datetime(\'now\') WHERE user_id = ?',
        [amount, userId],
      )
      this.db.run(
        'INSERT INTO transactions (from_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
        [userId, amount, 'gambled', `pool:${poolId}`],
      )

      this.db.run(
        `INSERT INTO game_pools (chat_id, pool_id, user_id, amount)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(chat_id, pool_id, user_id) DO UPDATE SET amount = amount + ?`,
        [chatId, poolId, userId, amount, amount],
      )
    })()
  }

  refund(chatId: number, poolId: string): number {
    return this.db.transaction(() => {
      const rows = this.db.query(
        'SELECT user_id, amount FROM game_pools WHERE chat_id = ? AND pool_id = ?',
      ).all(chatId, poolId) as { user_id: number; amount: number }[]

      if (rows.length === 0) return 0

      for (const r of rows) {
        this.deposit(r.user_id, r.amount, 'gambled', `pool refund:${poolId}`)
      }

      this.db.run('DELETE FROM game_pools WHERE chat_id = ? AND pool_id = ?', [chatId, poolId])
      return rows.reduce((s, r) => s + r.amount, 0)
    })()
  }

  award(chatId: number, poolId: string, winnerId: number): number {
    return this.db.transaction(() => {
      const row = this.db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM game_pools WHERE chat_id = ? AND pool_id = ?',
      ).get(chatId, poolId) as { total: number }

      if (row.total <= 0) throw new Error('Pool is empty')

      this.deposit(winnerId, row.total, 'gambled', `pool win:${poolId}`)

      this.db.run('DELETE FROM game_pools WHERE chat_id = ? AND pool_id = ?', [chatId, poolId])
      return row.total
    })()
  }

  split(
    chatId: number,
    poolId: string,
    recipients: Array<{ userId: number; amount: number }>,
  ): { distributed: number; fee: number } {
    return this.db.transaction(() => {
      const row = this.db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM game_pools WHERE chat_id = ? AND pool_id = ?',
      ).get(chatId, poolId) as { total: number }

      if (row.total <= 0) throw new Error('Pool is empty')
      if (recipients.length === 0) throw new Error('Recipients list is empty')

      const distributed = recipients.reduce((s, r) => s + r.amount, 0)
      const fee = row.total - distributed

      for (const r of recipients) {
        this.ensureUser(r.userId)
        this.db.run(
          'UPDATE users SET balance = balance + ?, updated_at = datetime(\'now\') WHERE user_id = ?',
          [r.amount, r.userId],
        )
        this.db.run(
          'INSERT INTO transactions (to_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [r.userId, r.amount, 'gambled', `pool split:${poolId}`],
        )
      }

      if (fee > 0) {
        this.db.run(
          'INSERT INTO transactions (from_user_id, amount, type, description) VALUES (NULL, ?, ?, ?)',
          [fee, 'fee', `pool fee:${poolId}`],
        )
      }

      this.db.run('DELETE FROM game_pools WHERE chat_id = ? AND pool_id = ?', [chatId, poolId])
      return { distributed, fee }
    })()
  }

  status(chatId: number, poolId: string): PoolStatus | null {
    const participants = this.db.query(
      'SELECT user_id, amount FROM game_pools WHERE chat_id = ? AND pool_id = ?',
    ).all(chatId, poolId) as { user_id: number; amount: number }[]

    if (participants.length === 0) return null

    return {
      total: participants.reduce((s, p) => s + p.amount, 0),
      participants: participants.map((p) => ({ userId: p.user_id, amount: p.amount })),
    }
  }

  restore(): PoolContribution[] {
    const rows = this.db.query(
      'SELECT chat_id, pool_id, user_id, amount FROM game_pools',
    ).all() as Array<{ chat_id: number; pool_id: string; user_id: number; amount: number }>

    return rows.map((r) => ({
      chatId: r.chat_id,
      poolId: r.pool_id,
      userId: r.user_id,
      amount: r.amount,
    }))
  }
}
