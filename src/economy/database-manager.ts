import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'

const MAX_BACKUPS = 5

export class DatabaseManager {
  constructor(private db: Database, private dbPath: string) {}

  initTables(): void {
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

    this.db.run(`
      CREATE TABLE IF NOT EXISTS game_pools (
        chat_id INTEGER NOT NULL,
        pool_id TEXT    NOT NULL,
        user_id INTEGER NOT NULL,
        amount  INTEGER NOT NULL,
        PRIMARY KEY (chat_id, pool_id, user_id)
      )
    `)
  }

  migrate(): void {
    try {
      this.db.run('ALTER TABLE users ADD COLUMN username TEXT')
    } catch {
      /* already exists */
    }
  }

  ensureUser(userId: number): void {
    this.db.run('INSERT OR IGNORE INTO users (user_id) VALUES (?)', [userId])
  }

  backupDb(): string | null {
    if (this.dbPath === ':memory:') return null
    const backupDir = join(dirname(this.dbPath), 'backups')
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })

    const dbMtime = statSync(this.dbPath).mtimeMs

    const existing = readdirSync(backupDir)
      .filter(f => f.startsWith('bipki-') && f.endsWith('.db'))
      .map(f => ({ name: f, path: join(backupDir, f) }))
      .sort((a, b) => b.name.localeCompare(a.name))

    const last = existing[0]
    if (last && statSync(last.path).mtimeMs >= dbMtime) {
      return last.path
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = join(backupDir, `bipki-${ts}.db`)
    this.db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`)

    const allFiles = [backupPath, ...existing.map(e => e.path)].sort().reverse()

    if (allFiles.length > MAX_BACKUPS) {
      for (const f of allFiles.slice(MAX_BACKUPS)) {
        unlinkSync(f)
      }
    }

    return backupPath
  }

  clearAll(): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('clearAll() is only available in test environment')
    }
    this.db.run('DELETE FROM transactions')
    this.db.run('DELETE FROM game_pools')
    this.db.run('DELETE FROM chat_users')
    this.db.run('DELETE FROM users')
  }
}
