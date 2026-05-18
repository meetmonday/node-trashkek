/** Discriminated union of all recognised transaction types. */
export type TxType =
  | 'daily'
  | 'transfer'
  | 'burn'
  | 'rain'
  | 'work'
  | 'admin'
  | 'fee'
  | 'gambled'

/** Full row from the `users` table. */
export interface UserRow {
  /** Telegram user ID (primary key). */
  user_id: number
  /** Current bipki balance. */
  balance: number
  /** Consecutive `/daily` streak count. */
  streak: number
  /** Date of last `/daily` claim (`YYYY-MM-DD`), or null. */
  last_daily: string | null
  /** Unix-ms timestamp of last `/work`, or null. */
  last_work: string | null
  /** Lifetime amount destroyed via burns + fees. */
  total_burned: number
  /** @username (without @), or null. */
  username: string | null
  /** Row creation timestamp. */
  created_at: string
  /** Last update timestamp. */
  updated_at: string
}

/** A single row from the `transactions` table. */
export interface TransactionRow {
  /** Auto-increment primary key. */
  id: number
  /** Sender user ID (`null` for system/rain deposits). */
  from_user_id: number | null
  /** Recipient user ID (`null` for withdrawals/burns). */
  to_user_id: number | null
  /** Gross amount of the transaction. */
  amount: number
  /** Transaction category. */
  type: TxType
  /** Optional human-readable reason. */
  description: string | null
  /** ISO-8601 timestamp of the transaction. */
  created_at: string
}

/** A row in a leaderboard result set. */
export interface TopRow {
  /** Telegram user ID. */
  user_id: number
  /** Current balance. */
  balance: number
  /** 1-based rank within the result set. */
  rank: number
  /** @username (without @), or null. */
  username: string | null
}

/** Result of a single `transfer()` call. */
export interface TransferResult {
  /** Gross amount removed from the sender. */
  sent: number
  /** Net amount credited to the recipient (sent - fee). */
  received: number
  /** Fee burned (ceil of 5 %), 0 for micro-transfers. */
  fee: number
}

/** Result of a `rainDistribute()` call. */
export interface RainDistributeResult {
  /** Total amount removed from sender (recipients + fee). */
  sent: number
  /** Amount burned as fee. */
  fee: number
  /** The recipients list that was actually credited. */
  recipients: Array<{ userId: number; amount: number }>
}

/** Aggregate economy statistics. */
export interface EconomyStats {
  /** Sum of all user balances (total money supply). */
  totalSupply: number
  /** Total number of registered users. */
  userCount: number
  /** Distinct users with at least one transaction in the last 7 days. */
  activeUsers: number
  /** Total transaction count across all time. */
  totalTransactions: number
  /** Sum of all `work`-type credits. */
  totalEarnedWork: number
  /** Sum of all `daily`-type credits. */
  totalEarnedDaily: number
  /** Sum of transaction amounts with type `burn` or `fee` (from `transactions` table). */
  totalBurned: number
  /** Sum of all `transfer`-type transactions. */
  totalTransferred: number
  /** Sum of all `gambled` transactions where `from_user_id IS NOT NULL` (bets only). */
  totalGambled: number
}
