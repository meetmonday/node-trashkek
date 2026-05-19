import type { DbApi } from './sql'
import type { EconomyStats, TopRow, TransactionRow } from './types'

/**
 * Read-only statistics and leaderboard queries.
 *
 * Thin wrapper that delegates all SQL to the `db.stats.*` / `db.transactions.*`
 * namespace in sql.ts.
 */
export class StatsQueries {
  constructor(private db: DbApi) {}

  economyStats(): EconomyStats {
    return this.db.stats.economyStats()
  }

  totalBurned(): number {
    return this.db.stats.totalBurned()
  }

  history(userId: number, limit = 5): TransactionRow[] {
    return this.db.transactions.history(userId, limit)
  }

  top(chatId?: number, limit = 10): TopRow[] {
    return this.db.stats.top(chatId, limit)
  }
}
