import { Database } from 'bun:sqlite'
import type { TransactionRow, TopRow, EconomyStats } from './types'

export class StatsQueries {
  constructor(private db: Database) {}

  economyStats(): EconomyStats {
    const row = this.db.query(`
      SELECT
        (SELECT COALESCE(SUM(balance), 0) FROM users) as totalSupply,
        (SELECT COUNT(*) FROM users) as userCount,
        (SELECT COUNT(DISTINCT user_id) FROM (
          SELECT from_user_id AS user_id FROM transactions WHERE created_at > datetime('now', '-7 days') AND from_user_id IS NOT NULL
          UNION
          SELECT to_user_id AS user_id FROM transactions WHERE created_at > datetime('now', '-7 days') AND to_user_id IS NOT NULL
        )) as activeUsers,
        (SELECT COUNT(*) FROM transactions) as totalTransactions,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'work' AND to_user_id IS NOT NULL) as totalEarnedWork,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'daily' AND to_user_id IS NOT NULL) as totalEarnedDaily,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN ('burn', 'fee')) as totalBurned,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'transfer') as totalTransferred,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'gambled' AND from_user_id IS NOT NULL) as totalGambled
    `).get() as EconomyStats
    return row
  }

  totalBurned(): number {
    const row = this.db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type IN ('burn', 'fee')",
    ).get() as { total: number }
    return row.total
  }

  history(userId: number, limit = 5): TransactionRow[] {
    const capped = Math.min(Math.max(1, limit), 20)
    return this.db.query(
      `SELECT * FROM transactions
       WHERE from_user_id = ? OR to_user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    ).all(userId, userId, capped) as TransactionRow[]
  }

  top(chatId?: number, limit = 10): TopRow[] {
    if (chatId) {
      return this.db.query(
        `SELECT u.user_id, u.balance, u.username, ROW_NUMBER() OVER (ORDER BY u.balance DESC) as rank
         FROM users u
         JOIN chat_users cu ON u.user_id = cu.user_id
         WHERE cu.chat_id = ?
         ORDER BY u.balance DESC
         LIMIT ?`,
      ).all(chatId, limit) as TopRow[]
    }

    return this.db.query(
      `SELECT user_id, balance, username, ROW_NUMBER() OVER (ORDER BY balance DESC) as rank
       FROM users
       ORDER BY balance DESC
       LIMIT ?`,
    ).all(limit) as TopRow[]
  }
}
