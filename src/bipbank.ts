import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'

const DB_PATH = process.env.BIPKI_DB_PATH || 'data/bipki.db'

export type TxType =
  | 'daily'
  | 'transfer'
  | 'burn'
  | 'rain'
  | 'work'
  | 'admin'
  | 'fee'

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

export interface TransactionRow {
  id: number
  from_user_id: number | null
  to_user_id: number | null
  amount: number
  type: TxType
  description: string | null
  created_at: string
}

export interface TopRow {
  user_id: number
  balance: number
  rank: number
  username: string | null
}

export interface TransferResult {
  sent: number
  received: number
  fee: number
}

export interface RainDistributeResult {
  sent: number
  fee: number
  recipients: Array<{ userId: number; amount: number }>
}

export interface EconomyStats {
  totalSupply: number
  userCount: number
  totalTransactions: number
  totalEarnedWork: number
  totalEarnedDaily: number
  totalBurned: number
  totalTransferred: number
}

export class BipBank {
  private db: Database

  constructor() {
    const dir = DB_PATH.lastIndexOf('/')
    if (dir > 0) {
      const dirPath = DB_PATH.slice(0, dir)
      if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true })
    }

    this.db = new Database(DB_PATH)
    this.db.run('PRAGMA journal_mode=WAL')
    this.db.run('PRAGMA busy_timeout=5000')
    this.db.run('PRAGMA foreign_keys=ON')
    this.initTables()
    this.migrate()
  }

  private initTables(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id      INTEGER PRIMARY KEY,
        balance      INTEGER NOT NULL DEFAULT 0,
        streak       INTEGER NOT NULL DEFAULT 0,
        last_daily   TEXT,
        last_work    TEXT,
        total_burned INTEGER NOT NULL DEFAULT 0,
        username     TEXT,
        created_at   TEXT DEFAULT (datetime('now')),
        updated_at   TEXT DEFAULT (datetime('now'))
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id INTEGER,
        to_user_id   INTEGER,
        amount       INTEGER NOT NULL,
        type         TEXT NOT NULL,
        description  TEXT,
        created_at   TEXT DEFAULT (datetime('now'))
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS chat_users (
        chat_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        PRIMARY KEY (chat_id, user_id)
      )
    `)
  }

  private ensureUser(userId: number): void {
    this.db.run('INSERT OR IGNORE INTO users (user_id) VALUES (?)', [userId])
  }

  /** Get user balance. Auto-creates user if doesn't exist. */
  balance(userId: number): number {
    this.ensureUser(userId)
    const row = this.db.query(
      'SELECT balance FROM users WHERE user_id = ?',
    ).get(userId) as { balance: number } | undefined
    return row?.balance ?? 0
  }

  /** Add bipki to user. Used by daily, work, admin, etc. */
  deposit(
    to: number,
    amount: number,
    type: TxType,
    description?: string,
  ): void {
    if (amount <= 0) throw new Error('Amount must be positive')
    this.ensureUser(to)

    this.db.run(
      'UPDATE users SET balance = balance + ?, updated_at = datetime(\'now\') WHERE user_id = ?',
      [amount, to],
    )
    this.db.run(
      'INSERT INTO transactions (to_user_id, amount, type, description) VALUES (?, ?, ?, ?)',
      [to, amount, type, description ?? null],
    )
  }

  /**
   * Remove bipki from user.
   * @returns `false` if balance is insufficient.
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
   * Transfer bipki between users with 5% fee burned.
   * If amount is too small for 5% (fee >= amount), fee is waived.
   *
   * @returns `{ sent, received, fee }` — sent is what left sender's balance.
   * @throws if balance is insufficient.
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
   * Total amount removed from sender = sum(recipients.amount) + fee.
   * The fee is recorded as type 'fee' and tracked in total_burned.
   *
   * @throws if balance is insufficient or recipients is empty.
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

  /** Global amount permanently removed from circulation (burns + fees). */
  totalBurned(): number {
    const row = this.db.query(
      "SELECT COALESCE(SUM(total_burned), 0) as total FROM users",
    ).get() as { total: number }
    return row.total
  }

  /** Economy-wide statistics. */
  economyStats(): EconomyStats {
    const row = this.db.query(`
      SELECT
        (SELECT COALESCE(SUM(balance), 0) FROM users) as totalSupply,
        (SELECT COUNT(*) FROM users) as userCount,
        (SELECT COUNT(*) FROM transactions) as totalTransactions,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'work' AND to_user_id IS NOT NULL) as totalEarnedWork,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'daily' AND to_user_id IS NOT NULL) as totalEarnedDaily,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN ('burn', 'fee')) as totalBurned,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'transfer') as totalTransferred
    `).get() as EconomyStats
    return row
  }

  /** Remove bipki from circulation and track total burned. */
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

  /** Get full user row. Auto-creates user if doesn't exist. */
  getUser(userId: number): UserRow {
    this.ensureUser(userId)
    const row = this.db.query('SELECT * FROM users WHERE user_id = ?').get(
      userId,
    ) as UserRow | undefined
    if (!row) throw new Error('User not found')
    return row
  }

  /** Update user metadata fields (streak, last_daily, last_work, etc.). */
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

  /** Get recent transactions for a user (default 5, max 20). */
  history(userId: number, limit = 5): TransactionRow[] {
    const capped = Math.min(Math.max(1, limit), 20)
    return this.db.query(
      `SELECT * FROM transactions
       WHERE from_user_id = ? OR to_user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    ).all(userId, userId, capped) as TransactionRow[]
  }

  /**
   * Get leaderboard.
   * @param chatId — if provided, scoped to chat; otherwise global.
   */
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

  /** Record that a user is present in a chat (for per-chat leaderboard). */
  ensureChatUser(chatId: number, userId: number): void {
    this.db.run(
      'INSERT OR IGNORE INTO chat_users (chat_id, user_id) VALUES (?, ?)',
      [chatId, userId],
    )
  }

  /** Get all user IDs tracked in a chat. */
  getChatUserIds(chatId: number): number[] {
    const rows = this.db.query(
      'SELECT user_id FROM chat_users WHERE chat_id = ?',
    ).all(chatId) as { user_id: number }[]

    return rows.map((r) => r.user_id)
  }

  private migrate(): void {
    try {
      this.db.run('ALTER TABLE users ADD COLUMN username TEXT')
    } catch {
      /* already exists */
    }
  }

  /** Update the stored username for a user. */
  setUsername(userId: number, username: string | null): void {
    this.ensureUser(userId)
    this.db.run('UPDATE users SET username = ? WHERE user_id = ?', [
      username,
      userId,
    ])
  }

  /** Clear all data (used in tests). */
  clearAll(): void {
    this.db.run('DELETE FROM transactions')
    this.db.run('DELETE FROM chat_users')
    this.db.run('DELETE FROM users')
  }

  /** Look up a user by their @username (case-insensitive). Returns `null` if not found. */
  findByUsername(username: string): number | null {
    const clean = username.replace('@', '').toLowerCase()
    const row = this.db.query(
      'SELECT user_id FROM users WHERE LOWER(username) = ?',
    ).get(clean) as { user_id: number } | undefined
    return row?.user_id ?? null
  }
}

export const bipbank = new BipBank()
