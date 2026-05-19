import { TX_TYPE } from './types'
import type { DbApi } from './sql'
import type { TransactionRow } from './types'

export class AdminManager {
  constructor(
    private db: DbApi,
  ) {}

  setBalance(userId: number, amount: number, description?: string): void {
    if (amount < 0) throw new Error('Amount must be non-negative')
    this.db.users.ensure(userId)

    this.db.transaction(() => {
      const prev = this.db.balance.of(userId)
      const diff = amount - prev

      this.db.balance.set(userId, amount)

      if (diff > 0) {
        this.db.transactions.insert({ to_user_id: userId, amount: diff, type: TX_TYPE.admin, description: description ?? 'admin set balance', systemDescription: false })
      } else if (diff < 0) {
        this.db.transactions.insert({ from_user_id: userId, amount: -diff, type: TX_TYPE.admin, description: description ?? 'admin set balance', systemDescription: false })
      }
    })
  }

  getTransactions(limit = 10): TransactionRow[] {
    return this.db.transactions.admin(limit)
  }
}
