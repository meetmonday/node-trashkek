/** Numeric transaction type constants. */
export const TX_TYPE = {
  daily: 1,
  transfer: 2,
  burn: 3,
  rain: 4,
  work: 5,
  admin: 6,
  fee: 7,
  gambled: 8,
} as const

/** Numeric transaction type (1–8). */
export type TxType = (typeof TX_TYPE)[keyof typeof TX_TYPE]

/** Reverse lookup: numeric TxType → human-readable name. */
export function txTypeName(type: number): string {
  return TX_TYPE_NAME[type] ?? 'unknown'
}

const TX_TYPE_NAME: Record<number, string> = {
  [TX_TYPE.daily]: 'daily',
  [TX_TYPE.transfer]: 'transfer',
  [TX_TYPE.burn]: 'burn',
  [TX_TYPE.rain]: 'rain',
  [TX_TYPE.work]: 'work',
  [TX_TYPE.admin]: 'admin',
  [TX_TYPE.fee]: 'fee',
  [TX_TYPE.gambled]: 'gambled',
}

/** Full row from the `users` table. */
export interface UserRow {
  user_id: number
  balance: number
  streak: number
  last_daily: string | null
  last_work: string | null
  total_burned: number
  username: string | null
  created_at: string
  updated_at: string
}

/** A single row from the `transactions` table (with resolved description). */
export interface TransactionRow {
  id: number
  from_user_id: number | null
  to_user_id: number | null
  amount: number
  type: number
  description: string | null
  created_at: number
  parent_tx_id: number | null
}

/** A row in a leaderboard result set. */
export interface TopRow {
  user_id: number
  balance: number
  rank: number
  username: string | null
}

/** Result of a single `transfer()` call. */
export interface TransferResult {
  sent: number
  received: number
  fee: number
}

/** Result of a `rainDistribute()` call. */
export interface RainDistributeResult {
  sent: number
  fee: number
  recipients: Array<{ userId: number; amount: number }>
}

/** Aggregate economy statistics. */
export interface EconomyStats {
  totalSupply: number
  userCount: number
  activeUsers: number
  totalTransactions: number
  totalEarnedWork: number
  totalEarnedDaily: number
  totalBurned: number
  totalTransferred: number
  totalGambled: number
}
