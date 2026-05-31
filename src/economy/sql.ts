import { Database } from 'bun:sqlite'
import type {
  TxType, UserRow, TransactionRow, TopRow, EconomyStats,
} from './types'
import { TX_TYPE } from './types'

export interface PoolParticipant {
  user_id: number
  amount: number
}

export interface PoolRestore {
  chat_id: number
  pool_id: string
  user_id: number
  amount: number
}

export interface InsertTxParams {
  from_user_id?: number | null
  to_user_id?: number | null
  amount: number
  type: number
  description?: string | null
  systemDescription?: boolean
  parentTxId?: number | null
}

// ── standalone query helpers (also usable inside transactions) ──

export function ensureUser(db: Database, userId: number): void {
  db.run('INSERT OR IGNORE INTO users (user_id) VALUES (?)', [userId])
}

export function balanceOf(db: Database, userId: number): number {
  const row = db.query('SELECT balance FROM users WHERE user_id = ?')
    .get(userId) as { balance: number } | undefined
  return row?.balance ?? 0
}

export function getUser(db: Database, userId: number): UserRow | undefined {
  return db.query('SELECT * FROM users WHERE user_id = ?')
    .get(userId) as UserRow | undefined
}

export function findUserIdByUsername(db: Database, username: string): number | null {
  const row = db.query('SELECT user_id FROM users WHERE LOWER(username) = ?')
    .get(username) as { user_id: number } | undefined
  return row?.user_id ?? null
}

export function updateUser(
  db: Database,
  userId: number,
  fields: Partial<Pick<UserRow, 'streak' | 'last_daily' | 'last_work' | 'username'>>,
): void {
  const keys = Object.keys(fields) as (keyof typeof fields)[]
  if (keys.length === 0) return
  const setClauses = keys.map(k => `${k} = ?`).join(', ')
  const values = keys.map(k => fields[k] ?? null)
  db.run(
    `UPDATE users SET ${setClauses}, updated_at = datetime('now') WHERE user_id = ?`,
    [...values, userId],
  )
}

export function setUsername(db: Database, userId: number, username: string | null): void {
  db.run('UPDATE users SET username = ? WHERE user_id = ?', [username, userId])
}

export function incrementBalance(db: Database, userId: number, amount: number): void {
  db.run(
    "UPDATE users SET balance = balance + ?, updated_at = datetime('now') WHERE user_id = ?",
    [amount, userId],
  )
}

export function decrementBalance(db: Database, userId: number, amount: number): void {
  db.run(
    "UPDATE users SET balance = balance - ?, updated_at = datetime('now') WHERE user_id = ?",
    [amount, userId],
  )
}

export function setBalance(db: Database, userId: number, amount: number): void {
  db.run(
    "UPDATE users SET balance = ?, updated_at = datetime('now') WHERE user_id = ?",
    [amount, userId],
  )
}

export function incrementBurned(db: Database, userId: number, amount: number): void {
  db.run(
    'UPDATE users SET total_burned = total_burned + ? WHERE user_id = ?',
    [amount, userId],
  )
}

/** Insert a single transaction record with optional description normalisation. Returns the new row id. */
export function insertTx(
  db: Database,
  tx: InsertTxParams,
): number {
  const { description, systemDescription, parentTxId } = tx
  const from = tx.from_user_id ?? null
  const to = tx.to_user_id ?? null
  const amount = tx.amount
  const type = tx.type

  if (systemDescription !== false && description) {
    db.run('INSERT OR IGNORE INTO descriptions (text) VALUES (?)', [description])
    const row = db.query('SELECT id FROM descriptions WHERE text = ?').get(description) as { id: number } | undefined
    const result = db.query(`
      INSERT INTO transactions (from_user_id, to_user_id, amount, type, description_id, parent_tx_id)
      VALUES (?, ?, ?, ?, ?, ?) RETURNING id
    `).get(from, to, amount, type, row?.id ?? null, parentTxId ?? null) as { id: number }
    return result.id
  }

  const result = db.query(`
    INSERT INTO transactions (from_user_id, to_user_id, amount, type, description, parent_tx_id)
    VALUES (?, ?, ?, ?, ?, ?) RETURNING id
  `).get(from, to, amount, type, description ?? null, parentTxId ?? null) as { id: number }
  return result.id
}

/** Recent transactions involving userId. Capped at 20. */
export function getHistory(db: Database, userId: number, limit: number): TransactionRow[] {
  const capped = Math.min(Math.max(1, limit), 20)
  return db.query(
    `SELECT t.id, t.from_user_id, t.to_user_id, t.amount, t.type,
            COALESCE(d.text, t.description) as description,
            t.created_at, t.parent_tx_id
     FROM transactions t
     LEFT JOIN descriptions d ON d.id = t.description_id
     WHERE t.from_user_id = ? OR t.to_user_id = ?
     ORDER BY t.created_at DESC
     LIMIT ?`,
  ).all(userId, userId, capped) as TransactionRow[]
}

/** Recent admin transactions. Capped at 50. */
export function getAdminTxs(db: Database, limit: number): TransactionRow[] {
  const capped = Math.min(Math.max(1, limit), 50)
  return db.query(
    `SELECT t.id, t.from_user_id, t.to_user_id, t.amount, t.type,
            COALESCE(d.text, t.description) as description,
            t.created_at, t.parent_tx_id
     FROM transactions t
     LEFT JOIN descriptions d ON d.id = t.description_id
     WHERE t.type = ?
     ORDER BY t.created_at DESC
     LIMIT ?`,
  ).all(TX_TYPE.admin, capped) as TransactionRow[]
}

/** Sum of all burn and fee transaction amounts. */
export function getTotalBurned(db: Database): number {
  const row = db.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type IN (?, ?)',
  ).get(TX_TYPE.burn, TX_TYPE.fee) as { total: number }
  return row.total
}

/** Aggregate economy statistics (supply, users, activity, etc.). */
export function getEconomyStats(db: Database): EconomyStats {
  return db.query(`
    SELECT
      (SELECT COALESCE(SUM(balance), 0) FROM users) as totalSupply,
      (SELECT COUNT(*) FROM users) as userCount,
      (SELECT COUNT(DISTINCT user_id) FROM (
        SELECT from_user_id AS user_id FROM transactions WHERE created_at > unixepoch('now', '-7 days') AND from_user_id IS NOT NULL
        UNION
        SELECT to_user_id AS user_id FROM transactions WHERE created_at > unixepoch('now', '-7 days') AND to_user_id IS NOT NULL
      )) as activeUsers,
      (SELECT COUNT(*) FROM transactions) as totalTransactions,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = ? AND to_user_id IS NOT NULL) as totalEarnedWork,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = ? AND to_user_id IS NOT NULL) as totalEarnedDaily,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN (?, ?)) as totalBurned,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = ?) as totalTransferred,
      (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = ? AND from_user_id IS NOT NULL) as totalGambled
  `).get(
    TX_TYPE.work,
    TX_TYPE.daily,
    TX_TYPE.burn, TX_TYPE.fee,
    TX_TYPE.transfer,
    TX_TYPE.gambled,
  ) as EconomyStats
}

/** Global or per-chat leaderboard. */
export function getTop(db: Database, chatId?: number, limit = 10): TopRow[] {
  if (chatId) {
    return db.query(
      `SELECT u.user_id, u.balance, u.username, ROW_NUMBER() OVER (ORDER BY u.balance DESC) as rank
       FROM users u
       JOIN chat_users cu ON u.user_id = cu.user_id
       WHERE cu.chat_id = ?
       ORDER BY u.balance DESC
       LIMIT ?`,
    ).all(chatId, limit) as TopRow[]
  }
  return db.query(
    `SELECT user_id, balance, username, ROW_NUMBER() OVER (ORDER BY balance DESC) as rank
     FROM users
     ORDER BY balance DESC
     LIMIT ?`,
  ).all(limit) as TopRow[]
}

/** Track user presence in a chat. Idempotent. */
export function ensureChatUser(db: Database, chatId: number, userId: number): void {
  db.run('INSERT OR IGNORE INTO chat_users (chat_id, user_id) VALUES (?, ?)', [chatId, userId])
}

/** List all known user IDs in a chat. */
export function getChatUserIds(db: Database, chatId: number): number[] {
  const rows = db.query('SELECT user_id FROM chat_users WHERE chat_id = ?')
    .all(chatId) as { user_id: number }[]
  return rows.map(r => r.user_id)
}

/** Insert or add to a user's contribution in a prize pool. */
export function upsertPoolContribution(
  db: Database, chatId: number, poolId: string, userId: number, amount: number,
): void {
  db.run(
    `INSERT INTO game_pools (chat_id, pool_id, user_id, amount)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(chat_id, pool_id, user_id) DO UPDATE SET amount = amount + ?`,
    [chatId, poolId, userId, amount, amount],
  )
}

/** Get all participants and their current stake in a pool. */
export function getPoolParticipants(
  db: Database, chatId: number, poolId: string,
): PoolParticipant[] {
  return db.query(
    'SELECT user_id, amount FROM game_pools WHERE chat_id = ? AND pool_id = ?',
  ).all(chatId, poolId) as PoolParticipant[]
}

/** Get total pool amount (sum of all stakes). */
export function getPoolTotalRaw(db: Database, chatId: number, poolId: string): number {
  const row = db.query(
    'SELECT COALESCE(SUM(amount), 0) as total FROM game_pools WHERE chat_id = ? AND pool_id = ?',
  ).get(chatId, poolId) as { total: number }
  return row.total
}

/** Delete all participants from a pool. */
export function deletePool(db: Database, chatId: number, poolId: string): void {
  db.run('DELETE FROM game_pools WHERE chat_id = ? AND pool_id = ?', [chatId, poolId])
}

/** Fetch every pool row (used on startup to restore in-memory state). */
export function getAllPools(db: Database): PoolRestore[] {
  return db.query(
    'SELECT chat_id, pool_id, user_id, amount FROM game_pools',
  ).all() as PoolRestore[]
}

/** CREATE TABLE IF NOT EXISTS for all 6 tables. */
export function initTables(db: Database): void {
  db.run(`
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
  db.run(`
    CREATE TABLE IF NOT EXISTS descriptions (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL UNIQUE
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id   INTEGER,
      to_user_id     INTEGER,
      amount         INTEGER NOT NULL,
      type           INTEGER NOT NULL,
      description    TEXT,
      description_id INTEGER REFERENCES descriptions(id),
      parent_tx_id   INTEGER REFERENCES transactions(id),
      created_at     INTEGER DEFAULT (unixepoch())
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_users (
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY (chat_id, user_id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS game_pools (
      chat_id INTEGER NOT NULL,
      pool_id TEXT    NOT NULL,
      user_id INTEGER NOT NULL,
      amount  INTEGER NOT NULL,
      PRIMARY KEY (chat_id, pool_id, user_id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
}

export function getMeta(db: Database, key: string): string | null {
  const row = db.query('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setMeta(db: Database, key: string, value: string): void {
  db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [key, value])
}

export function deleteMeta(db: Database, key: string): void {
  db.run('DELETE FROM meta WHERE key = ?', [key])
}

/** One-shot schema migrations. */
export function migrateSchema(db: Database): void {
  try {
    db.run('ALTER TABLE users ADD COLUMN username TEXT')
  } catch {}
  try {
    db.run('ALTER TABLE transactions ADD COLUMN description_id INTEGER REFERENCES descriptions(id)')
  } catch {}
  try {
    db.run('ALTER TABLE transactions ADD COLUMN parent_tx_id INTEGER REFERENCES transactions(id)')
  } catch {}
}

/** DELETE all rows from every table (test environments only). */
export function clearAll(db: Database): void {
  db.run('DELETE FROM transactions')
  db.run('DELETE FROM descriptions')
  db.run('DELETE FROM game_pools')
  db.run('DELETE FROM chat_users')
  db.run('DELETE FROM users')
  db.run('DELETE FROM meta')
}

// ── Namespaced API ──

export function createDbApi(db: Database) {
  return {
    raw: db,

    transaction<T>(fn: () => T): T {
      return db.transaction(fn)()
    },

    balance: {
      of(userId: number): number {
        return balanceOf(db, userId)
      },
      add(userId: number, amount: number): void {
        incrementBalance(db, userId, amount)
      },
      sub(userId: number, amount: number): void {
        decrementBalance(db, userId, amount)
      },
      set(userId: number, amount: number): void {
        setBalance(db, userId, amount)
      },
    },

    users: {
      ensure(userId: number): void {
        ensureUser(db, userId)
      },
      get(userId: number): UserRow | undefined {
        return getUser(db, userId)
      },
      update(
        userId: number,
        fields: Partial<Pick<UserRow, 'streak' | 'last_daily' | 'last_work' | 'username'>>,
      ): void {
        updateUser(db, userId, fields)
      },
      setUsername(userId: number, username: string | null): void {
        setUsername(db, userId, username)
      },
      findByUsername(username: string): number | null {
        return findUserIdByUsername(db, username.toLowerCase().replace('@', ''))
      },
    },

    burned: {
      add(userId: number, amount: number): void {
        incrementBurned(db, userId, amount)
      },
    },

    transactions: {
      insert(tx: InsertTxParams): number {
        return insertTx(db, tx)
      },
      history(userId: number, limit = 5): TransactionRow[] {
        return getHistory(db, userId, limit)
      },
      admin(limit = 10): TransactionRow[] {
        return getAdminTxs(db, limit)
      },
    },

    stats: {
      totalBurned(): number {
        return getTotalBurned(db)
      },
      economyStats(): EconomyStats {
        return getEconomyStats(db)
      },
      top(chatId?: number, limit = 10): TopRow[] {
        return getTop(db, chatId, limit)
      },
    },

    chatUsers: {
      ensure(chatId: number, userId: number): void {
        ensureChatUser(db, chatId, userId)
      },
      userIds(chatId: number): number[] {
        return getChatUserIds(db, chatId)
      },
    },

    pools: {
      upsertContribution(chatId: number, poolId: string, userId: number, amount: number): void {
        upsertPoolContribution(db, chatId, poolId, userId, amount)
      },
      participants(chatId: number, poolId: string): PoolParticipant[] {
        return getPoolParticipants(db, chatId, poolId)
      },
      totalRaw(chatId: number, poolId: string): number {
        return getPoolTotalRaw(db, chatId, poolId)
      },
      delete(chatId: number, poolId: string): void {
        deletePool(db, chatId, poolId)
      },
      all(): PoolRestore[] {
        return getAllPools(db)
      },
    },

    meta: {
      initTables(): void {
        initTables(db)
      },
      migrate(): void {
        migrateSchema(db)
      },
      clearAll(): void {
        clearAll(db)
      },
      get(key: string): string | null {
        return getMeta(db, key)
      },
      set(key: string, value: string): void {
        setMeta(db, key, value)
      },
      delete(key: string): void {
        deleteMeta(db, key)
      },
    },
  }
}

export type DbApi = ReturnType<typeof createDbApi>
