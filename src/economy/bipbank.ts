import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { PoolManager } from './pool-manager'
import { Stabilizer } from './stabilizer'
import { AdminManager } from './admin-manager'
import { DatabaseManager } from './database-manager'
import { StatsQueries } from './stats-queries'
import type {
  TxType, UserRow, TransactionRow, TopRow, EconomyStats,
  TransferResult, RainDistributeResult,
} from './types'

function getDbPath(): string {
  return process.env.BIPKI_DB_PATH || 'data/bipki.db'
}

/**
 * Core engine for the Bipki internal currency system.
 *
 * Manages user balances, transactions, chat members, and prize pools
 * in a local SQLite database (`data/bipki.db` or `BIPKI_DB_PATH` env).
 *
 * Exposed as a singleton via `import { bipbank } from '@/economy'`.
 */
export class BipBank {
  private db: Database

  /** Prize pool manager — contribute, award, split, refund, status, restore. */
  readonly pools: PoolManager

  /** Create or open the database, run migrations. */
  readonly dbPath: string

  constructor() {
    this.dbPath = getDbPath()
    const dir = this.dbPath.lastIndexOf('/')
    if (dir > 0) {
      const dirPath = this.dbPath.slice(0, dir)
      if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true })
    }

    this.db = new Database(this.dbPath)
    this.db.run('PRAGMA journal_mode=WAL')
    this.db.run('PRAGMA busy_timeout=5000')
    this.db.run('PRAGMA foreign_keys=ON')
    this.db.run('PRAGMA synchronous=FULL')
    this.db.run('PRAGMA journal_size_limit=268435456')
    this.db.run('PRAGMA cache_size=-64000')
    this.dbManager = new DatabaseManager(this.db)
    this.dbManager.initTables()
    this.dbManager.migrate()
    this.backupDb()

    this.pools = new PoolManager(
      this.db,
      (to, amount, type, desc) => this.deposit(to, amount, type, desc),
      (id) => this.ensureUser(id),
    )

    this.stats = new StatsQueries(this.db)
    this.stabilizer = new Stabilizer(() => this.stats.economyStats())
    this.admin = new AdminManager(this.db, (id) => this.ensureUser(id))
  }

  readonly stabilizer: Stabilizer
  readonly admin: AdminManager
  readonly stats: StatsQueries
  private dbManager: DatabaseManager

  ensureUser(userId: number): void {
    this.dbManager.ensureUser(userId)
  }

  /**
   * Get user balance.
   *
   * @param userId - Telegram user ID.
   * @returns Current balance (auto-creates user if doesn't exist).
   */
  balance(userId: number): number {
    this.ensureUser(userId)
    const row = this.db.query(
      'SELECT balance FROM users WHERE user_id = ?',
    ).get(userId) as { balance: number } | undefined
    return row?.balance ?? 0
  }

  /**
   * Add bipki to user.
   *
   * @param to - Recipient user ID.
   * @param amount - Amount to credit (must be positive).
   * @param type - Transaction type for the history record.
   * @param description - Optional human-readable reason.
   * @throws {Error} If amount is not positive.
   */
  deposit(
    to: number,
    amount: number,
    type: TxType,
    description?: string,
  ): void {
    if (amount <= 0) throw new Error('Amount must be positive')
    this.ensureUser(to)

    this.db.transaction(() => {
      this.db.run(
        'UPDATE users SET balance = balance + ?, updated_at = datetime(\'now\') WHERE user_id = ?',
        [amount, to],
      )
      this.db.run(
        'INSERT INTO transactions (to_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
        [to, amount, type, description ?? null],
      )
    })()
  }

  /**
   * Remove bipki from user.
   *
   * @param from - User ID to debit.
   * @param amount - Amount to withdraw (must be positive).
   * @param type - Transaction type for the history record.
   * @param description - Optional human-readable reason.
   * @returns `false` if balance is insufficient, `true` on success.
   */
  withdraw(
    from: number,
    amount: number,
    type: TxType,
    description?: string,
  ): boolean {
    if (amount <= 0) throw new Error('Amount must be positive')
    this.ensureUser(from)

    return this.db.transaction(() => {
      const row = this.db.query(
        'SELECT balance FROM users WHERE user_id = ?',
      ).get(from) as { balance: number } | undefined

      if (!row || row.balance < amount) return false

      this.db.run(
        'UPDATE users SET balance = balance - ?, updated_at = datetime(\'now\') WHERE user_id = ?',
        [amount, from],
      )
      this.db.run(
        'INSERT INTO transactions (from_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
        [from, amount, type, description ?? null],
      )
      return true
    })()
  }

  /**
   * Transfer bipki between users with a 5 % fee that is burned.
   *
   * If the calculated fee would consume the entire amount (micro-transfers),
   * the fee is waived (fee = 0). The fee transaction increments the sender's
   * `total_burned` counter.
   *
   * @param from - Sender user ID.
   * @param to - Recipient user ID.
   * @param amount - Gross amount to send (fee is subtracted).
   * @param description - Optional comment (stored in the transfer transaction).
   * @returns `{ sent, received, fee }` — sent is the gross amount, received is net after fee.
   * @throws {Error} If amount is not positive, sender === recipient, or balance insufficient.
   */
  transfer(
    from: number,
    to: number,
    amount: number,
    description?: string,
  ): TransferResult {
    if (amount <= 0) throw new Error('Amount must be positive')
    if (from === to) throw new Error('Cannot transfer to yourself')
    this.ensureUser(from)
    this.ensureUser(to)

    return this.db.transaction(() => {
      const row = this.db.query(
        'SELECT balance FROM users WHERE user_id = ?',
      ).get(from) as { balance: number } | undefined

      if (!row || row.balance < amount) {
        throw new Error('Insufficient balance')
      }

      let fee = Math.ceil(amount * 0.05)
      if (fee >= amount) fee = 0
      const received = amount - fee

      this.db.run(
        'UPDATE users SET balance = balance - ?, updated_at = datetime(\'now\') WHERE user_id = ?',
        [amount, from],
      )
      this.db.run(
        'UPDATE users SET balance = balance + ?, updated_at = datetime(\'now\') WHERE user_id = ?',
        [received, to],
      )
      this.db.run(
        'INSERT INTO transactions (from_user_id, to_user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)',
        [from, to, amount, 'transfer', description ?? null],
      )

      if (fee > 0) {
        this.db.run(
          'UPDATE users SET total_burned = total_burned + ? WHERE user_id = ?',
          [fee, from],
        )
        this.db.run(
          'INSERT INTO transactions (from_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [from, fee, 'fee', description ? `transfer fee: ${description}` : 'transfer fee'],
        )
      }

      return { sent: amount, received, fee }
    })()
  }

  /**
   * Atomically distribute bipki to multiple recipients.
   *
   * Total removed from sender = sum(recipients.amount) + fee.
   * The fee is recorded as type `'fee'` and increments `total_burned`.
   *
   * @param from - Sender user ID.
   * @param recipients - Array of `{ userId, amount }` pairs to credit.
   * @param fee - Amount to burn on top of the distribution.
   * @param description - Optional reason (stored in the rain transaction, not per-recipient).
   * @returns `{ sent, fee, recipients }`.
   * @throws {Error} If recipients list is empty, total <= 0, or balance insufficient.
   */
  rainDistribute(
    from: number,
    recipients: Array<{ userId: number; amount: number }>,
    fee: number,
    description?: string,
  ): RainDistributeResult {
    if (recipients.length === 0) throw new Error('Recipients list is empty')
    const total = recipients.reduce((s, r) => s + r.amount, 0) + fee
    if (total <= 0) throw new Error('Total amount must be positive')
    this.ensureUser(from)
    for (const r of recipients) this.ensureUser(r.userId)

    return this.db.transaction(() => {
      const row = this.db.query(
        'SELECT balance FROM users WHERE user_id = ?',
      ).get(from) as { balance: number } | undefined

      if (!row || row.balance < total) {
        throw new Error('Insufficient balance')
      }

      this.db.run(
        'UPDATE users SET balance = balance - ?, updated_at = datetime(\'now\') WHERE user_id = ?',
        [total, from],
      )
      this.db.run(
        'INSERT INTO transactions (from_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
        [from, total, 'rain', description ?? null],
      )

      for (const r of recipients) {
        this.db.run(
          'UPDATE users SET balance = balance + ?, updated_at = datetime(\'now\') WHERE user_id = ?',
          [r.amount, r.userId],
        )
        this.db.run(
          'INSERT INTO transactions (to_user_id, amount, type) VALUES (?, ?, ?)',
          [r.userId, r.amount, 'rain'],
        )
      }

      if (fee > 0) {
        this.db.run(
          'UPDATE users SET total_burned = total_burned + ? WHERE user_id = ?',
          [fee, from],
        )
        this.db.run(
          'INSERT INTO transactions (from_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [from, fee, 'fee', description ? `rain fee: ${description}` : 'rain fee'],
        )
      }

      return { sent: total, fee, recipients }
    })()
  }

  totalBurned(): number {
    return this.stats.totalBurned()
  }

  economyStats(): EconomyStats {
    return this.stats.economyStats()
  }

  /**
   * Permanently remove bipki from circulation.
   *
   * Debits the user's balance and increments their `total_burned` counter.
   *
   * @param userId - User ID performing the burn.
   * @param amount - Amount to destroy (must be positive).
   * @throws {Error} If amount is not positive or balance insufficient.
   */
  burn(userId: number, amount: number): void {
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
        'UPDATE users SET balance = balance - ?, total_burned = total_burned + ?, updated_at = datetime(\'now\') WHERE user_id = ?',
        [amount, amount, userId],
      )
      this.db.run(
        'INSERT INTO transactions (from_user_id, amount, type) VALUES (?, ?, ?)',
        [userId, amount, 'burn'],
      )
    })()
  }

  /**
   * Get the full user row.
   *
   * @param userId - Telegram user ID.
   * @returns The `UserRow` (auto-creates user if it doesn't exist).
   */
  getUser(userId: number): UserRow {
    this.ensureUser(userId)
    const row = this.db.query('SELECT * FROM users WHERE user_id = ?').get(
      userId,
    ) as UserRow | undefined
    if (!row) throw new Error('User not found')
    return row
  }

  /**
   * Update user metadata fields.
   *
   * Accepts a partial object with any of: `streak`, `last_daily`,
   * `last_work`, `username`. Silently skips if the updates object is empty.
   *
   * @param userId - Target user ID.
   * @param updates - Partial row fields to write.
   */
  updateUser(
    userId: number,
    updates: Partial<
      Pick<UserRow, 'streak' | 'last_daily' | 'last_work' | 'username'>
    >,
  ): void {
    this.ensureUser(userId)
    const keys = Object.keys(updates) as (keyof typeof updates)[]
    if (keys.length === 0) return

    const setClauses = keys.map((k) => `${k} = ?`).join(', ')
    const values = keys.map((k) => updates[k] ?? null)

    this.db.run(
      `UPDATE users SET ${setClauses}, updated_at = datetime('now') WHERE user_id = ?`,
      [...values, userId],
    )
  }

  history(userId: number, limit = 5): TransactionRow[] {
    return this.stats.history(userId, limit)
  }

  top(chatId?: number, limit = 10): TopRow[] {
    return this.stats.top(chatId, limit)
  }

  /**
   * Record that a user is present in a chat.
   *
   * Used for per-chat leaderboard scoping. Idempotent — silently ignores
   * duplicates.
   *
   * @param chatId - Telegram chat ID.
   * @param userId - Telegram user ID.
   */
  ensureChatUser(chatId: number, userId: number): void {
    this.db.run(
      'INSERT OR IGNORE INTO chat_users (chat_id, user_id) VALUES (?, ?)',
      [chatId, userId],
    )
  }

  /**
   * Get all user IDs tracked in a chat.
   *
   * @param chatId - Telegram chat ID.
   * @returns Array of user IDs.
   */
  getChatUserIds(chatId: number): number[] {
    const rows = this.db.query(
      'SELECT user_id FROM chat_users WHERE chat_id = ?',
    ).all(chatId) as { user_id: number }[]

    return rows.map((r) => r.user_id)
  }

  private migrate(): void {
    this.dbManager.migrate()
  }

  /**
   * Persist (or clear) a user's @username for mention resolution.
   *
   * @param userId - Telegram user ID.
   * @param username - Username (without `@`) or `null` to clear.
   */
  setUsername(userId: number, username: string | null): void {
    this.ensureUser(userId)
    this.db.run('UPDATE users SET username = ? WHERE user_id = ?', [
      username,
      userId,
    ])
  }

  backupDb(): string | null {
    if (this.dbPath === ':memory:') return null
    const backupDir = join(dirname(this.dbPath), 'backups')
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = join(backupDir, `bipki-${ts}.db`)
    this.db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`)
    return backupPath
  }

  /**
   * Delete all rows from every table.
   *
   * Intended for test isolation between cases. Clears `transactions`,
   * `game_pools`, `chat_users`, and `users`.
   */
  clearAll(): void {
    if (this.dbPath !== ':memory:') {
      throw new Error('clearAll() is only available on in-memory databases')
    }
    this.dbManager.clearAll()
    this.stabilizer.reset()
  }

  /**
   * Look up a user by their @username (case-insensitive).
   *
   * Strips a leading `@` if present. Only returns users who have
   * interacted with a bipki command (so their username was saved).
   *
   * @param username - Username with or without leading `@`.
   * @returns The user ID, or `null` if not found.
   */
  findByUsername(username: string): number | null {
    const clean = username.replace('@', '').toLowerCase()
    const row = this.db.query(
      'SELECT user_id FROM users WHERE LOWER(username) = ?',
    ).get(clean) as { user_id: number } | undefined
    return row?.user_id ?? null
  }

  close(): void {
    try {
      this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
    } catch {
      // checkpoint may fail if db is busy, ignore
    }
    this.db.close()
  }
}

let _instance: BipBank | undefined

function getInstance(): BipBank {
  if (!_instance) _instance = new BipBank()
  return _instance
}

export const bipbank = new Proxy({} as BipBank, {
  get(_, prop) {
    return Reflect.get(getInstance(), prop, getInstance())
  },
  set(_, prop, value) {
    Reflect.set(getInstance(), prop, value)
    return true
  },
})
