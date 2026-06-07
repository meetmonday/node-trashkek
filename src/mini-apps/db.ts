import { Database } from "bun:sqlite"
import { existsSync, mkdirSync } from "fs"

let _db: Database | null = null

function getDbPath(): string {
  return process.env.BIPKI_DB_PATH || "data/bipki.db"
}

export function getDb(): Database {
  if (!_db) {
    const path = getDbPath()
    const dir = path.lastIndexOf("/")
    if (dir > 0) {
      const dirPath = path.slice(0, dir)
      if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true })
    }
    _db = new Database(path)
    _db.run("PRAGMA journal_mode=WAL")
    _db.run("PRAGMA busy_timeout=5000")
    _db.run("PRAGMA foreign_keys=ON")
  }
  return _db
}

export function closeDb(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}

export type { PlantRow, PlotRow, InventoryRow, TradeRow } from "./types"
