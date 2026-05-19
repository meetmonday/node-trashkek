import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'

const MAX_BACKUPS = 5

/**
 * File-system level database operations.
 *
 * No longer handles table creation or migration — those live in `sql.ts`.
 * This class is solely responsible for creating file backups via VACUUM INTO.
 */
export class DatabaseManager {
  constructor(private db: Database, private dbPath: string) {}

  /**
   * Create a point-in-time backup of the database file using `VACUUM INTO`.
   *
   * - Skips if the database is `:memory:`.
   * - Skips if the latest existing backup is already up-to-date (mtime check).
   * - Prunes old backups, keeping the last `MAX_BACKUPS` (5).
   *
   * @returns Path to the backup file, or null if skipped.
   */
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
}
