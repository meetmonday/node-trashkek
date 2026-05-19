/**
 * One-shot migration: convert an existing bipki.db to the new schema.
 *
 * Changes applied:
 *   1. `type` column: TEXT → INTEGER (using TX_TYPE mapping)
 *   2. `created_at` column: TEXT → INTEGER (unix timestamp)
 *   3. New `descriptions` table for deduplicated system descriptions (excluding fees)
 *   4. New `description_id` column on transactions
 *   5. New `parent_tx_id` column — fee transactions linked to parent transfer/rain
 *   6. Normalise existing system descriptions; fee descriptions stay inline
 *   7. Link existing fee entries to parent transactions
 *
 * Usage:
 *   BIPKI_DB_PATH=data/bipki.db bun run scripts/migrate-db.ts
 *
 * The original DB is backed up to data/bipki.db.pre-migrate before any writes.
 */

import { Database } from 'bun:sqlite'
import { copyFileSync, existsSync } from 'fs'

// ── Numeric type constants (must match src/economy/types.ts) ──
const TX_TYPE: Record<string, number> = {
  daily: 1,
  transfer: 2,
  burn: 3,
  rain: 4,
  work: 5,
  admin: 6,
  fee: 7,
  gambled: 8,
}

const TX_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(TX_TYPE).map(([k, v]) => [v, k]),
)

// ── Helpers ──

function isUserDescription(type: number | string, desc: string | null): boolean {
  if (!desc) return false
  if (type === TX_TYPE.transfer) return true
  if (type === TX_TYPE.admin) return true
  return false
}

// ── Main ──

const dbPath = process.env.BIPKI_DB_PATH || 'data/bipki.db'

if (!existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`)
  process.exit(1)
}

// Backup
const backup = `${dbPath}.pre-migrate`
console.log(`Backing up ${dbPath} → ${backup}`)
copyFileSync(dbPath, backup)

const db = new Database(dbPath)
db.run('PRAGMA journal_mode=WAL')

// 1. Create descriptions table
console.log('Creating descriptions table…')
db.run(`
  CREATE TABLE IF NOT EXISTS descriptions (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL UNIQUE
  )
`)

// 2. Add new columns (safe if already exist)
try {
  db.run('ALTER TABLE transactions ADD COLUMN description_id INTEGER REFERENCES descriptions(id)')
} catch {}
try {
  db.run('ALTER TABLE transactions ADD COLUMN parent_tx_id INTEGER REFERENCES transactions(id)')
} catch {}

// 3. Normalise system descriptions (EXCLUDING fees and user types)
console.log('Normalising system descriptions…')
const systemDescRows = db.query(`
  SELECT DISTINCT description FROM transactions
  WHERE description IS NOT NULL
    AND type NOT IN ('transfer', 'admin', 'fee')
  ORDER BY description
`).all() as { description: string }[]

for (const { description } of systemDescRows) {
  db.run('INSERT OR IGNORE INTO descriptions (text) VALUES (?)', [description])
}

db.run(`
  UPDATE transactions SET description_id = (
    SELECT id FROM descriptions WHERE text = transactions.description
  )
  WHERE description IS NOT NULL
    AND description_id IS NULL
    AND type NOT IN ('transfer', 'admin', 'fee')
`)

db.run('UPDATE transactions SET description = NULL WHERE description_id IS NOT NULL AND description IS NOT NULL')

// 4. Link existing fee transactions to parent transfer/rain
console.log('Linking fee transactions to parent transfers…')
db.run(`
  UPDATE transactions AS tx
  SET parent_tx_id = (
    SELECT p.id FROM transactions p
    WHERE p.from_user_id = tx.from_user_id
      AND p.type IN ('transfer', 'rain')
      AND tx.created_at = p.created_at
    LIMIT 1
  )
  WHERE tx.type = 'fee'
    AND tx.parent_tx_id IS NULL
    AND tx.from_user_id IS NOT NULL
`)

// Clear description on fees that now have a parent
db.run('UPDATE transactions SET description = NULL WHERE parent_tx_id IS NOT NULL AND description IS NOT NULL')

// 5. Convert type and created_at columns
console.log('Migrating type and created_at columns…')

const typeUpdateCases = Object.entries(TX_TYPE)
  .map(([name, num]) => `WHEN '${name}' THEN ${num}`)
  .join(' ')

db.run(`
  UPDATE transactions SET type = CASE type ${typeUpdateCases} END
  WHERE typeof(type) = 'text'
`)

db.run(`
  UPDATE transactions
  SET created_at = CAST(strftime('%s', created_at) AS INTEGER)
  WHERE typeof(created_at) = 'text'
`)

// 6. Rebuild table with correct column types
console.log('Rebuilding transactions table with INTEGER columns…')

db.run(`
  CREATE TABLE transactions_new (
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
  INSERT INTO transactions_new
    (id, from_user_id, to_user_id, amount, type, description, description_id, parent_tx_id, created_at)
  SELECT id, from_user_id, to_user_id, amount, type, description, description_id, parent_tx_id, created_at
  FROM transactions
`)

db.run('DROP TABLE transactions')
db.run('ALTER TABLE transactions_new RENAME TO transactions')

// 7. Create indexes
console.log('Creating indexes…')
db.run('CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(from_user_id, to_user_id)')
db.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)')
db.run('CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at)')

// 8. Verify
const total = db.query('SELECT COUNT(*) as n FROM transactions').get() as { n: number }
const textTypes = db.query("SELECT COUNT(*) as n FROM transactions WHERE typeof(type) = 'text'").get() as { n: number }
const textDates = db.query("SELECT COUNT(*) as n FROM transactions WHERE typeof(created_at) = 'text'").get() as { n: number }
const normCount = db.query('SELECT COUNT(*) as n FROM descriptions').get() as { n: number }
const linkedDesc = db.query('SELECT COUNT(*) as n FROM transactions WHERE description_id IS NOT NULL').get() as { n: number }
const linkedParent = db.query('SELECT COUNT(*) as n FROM transactions WHERE parent_tx_id IS NOT NULL').get() as { n: number }

console.log(`\n✓ Migration complete`)
console.log(`  Transactions:        ${total.n}`)
console.log(`  Still TEXT type:     ${textTypes.n}`)
console.log(`  Still TEXT dates:    ${textDates.n}`)
console.log(`  Normalised descs:    ${normCount.n}`)
console.log(`  Linked via desc_id:  ${linkedDesc.n}`)
console.log(`  Linked via parent:   ${linkedParent.n}`)
console.log(`\nBackup saved to: ${backup}`)

db.close()
