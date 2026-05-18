import { Database } from 'bun:sqlite'
import type { TransactionRow } from './types'

export class AdminManager {
  constructor(
    private db: Database,
    private ensureUser: (userId: number) => void,
  ) {}

  setBalance(userId: number, amount: number, description?: string): void {
    if (amount < 0) throw new Error('Amount must be non-negative')
    this.ensureUser(userId)

    this.db.transaction(() => {
      const row = this.db.query(
        'SELECT balance FROM users WHERE user_id = ?',
      ).get(userId) as { balance: number } | undefined
      const prev = row?.balance ?? 0
      const diff = amount - prev

      this.db.run(
        'UPDATE users SET balance = ?, updated_at = datetime(\'now\') WHERE user_id = ?',
        [amount, userId],
      )

      if (diff > 0) {
        this.db.run(
          'INSERT INTO transactions (to_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [userId, diff, 'admin', description ?? 'admin set balance'],
        )
      } else if (diff < 0) {
        this.db.run(
          'INSERT INTO transactions (from_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [userId, -diff, 'admin', description ?? 'admin set balance'],
        )
      }
    })()
  }

  getTransactions(limit = 10): TransactionRow[] {
    const capped = Math.min(Math.max(1, limit), 50)
    return this.db.query(
      `SELECT * FROM transactions WHERE type = 'admin' ORDER BY created_at DESC LIMIT ?`,
    ).all(capped) as TransactionRow[]
  }
}
