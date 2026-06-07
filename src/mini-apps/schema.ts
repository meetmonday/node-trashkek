import type { Database } from "bun:sqlite"

function addColumnIfMissing(db: Database, table: string, column: string, def: string): void {
  const existing = db.query(`PRAGMA table_info('${table}')`).all() as { name: string }[]
  if (!existing.some(c => c.name === column)) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`)
  }
}

export function initGardenSchema(db: Database): void {
  migrateGardenTables(db)

  db.run(`
    CREATE TABLE IF NOT EXISTS garden_subspecies (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id          INTEGER NOT NULL REFERENCES garden_plants(id),
      name              TEXT NOT NULL,
      rarity            TEXT NOT NULL DEFAULT 'common',
      emoji             TEXT NOT NULL,
      price_mult        REAL NOT NULL DEFAULT 1.0,
      growth_mult       REAL NOT NULL DEFAULT 1.0,
      germination_chance REAL NOT NULL DEFAULT 0.80,
      discover_weight   INTEGER NOT NULL DEFAULT 10,
      created_at        TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS garden_discoveries (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL REFERENCES users(user_id),
      subspecies_id  INTEGER NOT NULL REFERENCES garden_subspecies(id),
      discovered_at  TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, subspecies_id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS garden_plots_owned (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(user_id),
      plots_max  INTEGER NOT NULL DEFAULT 1 CHECK(plots_max BETWEEN 1 AND 9),
      UNIQUE(user_id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS garden_quests (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER NOT NULL REFERENCES users(user_id),
      quest_id  INTEGER NOT NULL,
      progress  INTEGER NOT NULL DEFAULT 0,
      target    INTEGER NOT NULL DEFAULT 1,
      reward    TEXT NOT NULL,
      claimed   INTEGER DEFAULT 0,
      date      TEXT NOT NULL,
      UNIQUE(user_id, quest_id, date)
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_garden_inventory_user ON garden_inventory(user_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_garden_plots_user ON garden_plots(user_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_garden_trades_seller ON garden_trades(seller_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_garden_trades_status ON garden_trades(status)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_garden_subspecies_plant ON garden_subspecies(plant_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_garden_discoveries_user ON garden_discoveries(user_id)`)

  seedDefaultPlants(db)
  seedDefaultSubspecies(db)
}

function migrateGardenTables(db: Database): void {
  const plantsExist = db.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='garden_plants'"
  ).get() as { name: string } | undefined

  if (!plantsExist) {
    createGardenPlants(db)
    createGardenPlots(db)
    createGardenInventory(db)
    createGardenTrades(db)
    return
  }

  addColumnIfMissing(db, "garden_plots", "subspecies_id", "INTEGER REFERENCES garden_subspecies(id)")
  addColumnIfMissing(db, "garden_plots", "withered_at", "TEXT")
  addColumnIfMissing(db, "garden_inventory", "subspecies_id", "INTEGER REFERENCES garden_subspecies(id)")

  const tradeCols = db.query("PRAGMA table_info('garden_trades')").all() as { name: string }[]
  const hasCurrency = tradeCols.some(c => c.name === 'currency')
  if (hasCurrency) {
    db.run("DROP TABLE IF EXISTS garden_trades_old")
    db.run("ALTER TABLE garden_trades RENAME TO garden_trades_old")
    createGardenTrades(db)
    db.run(`INSERT INTO garden_trades (id, seller_id, item_id, price, status, created_at)
      SELECT id, seller_id, item_id, price, status, created_at FROM garden_trades_old`)
    db.run("DROP TABLE garden_trades_old")
  }
}

function createGardenPlants(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS garden_plants (
      id          INTEGER PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      seed_price  INTEGER NOT NULL,
      growth_sec  INTEGER NOT NULL,
      max_level   INTEGER NOT NULL DEFAULT 3,
      created_at  TEXT DEFAULT (datetime('now'))
    )
  `)
}

function createGardenPlots(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS garden_plots (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      idx          INTEGER NOT NULL,
      plant_id     INTEGER,
      subspecies_id INTEGER,
      planted_at   TEXT,
      withered_at  TEXT,
      stage        INTEGER DEFAULT 0,
      level        INTEGER DEFAULT 0,
      state        TEXT DEFAULT 'empty',
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      UNIQUE(user_id, idx)
    )
  `)
}

function createGardenInventory(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS garden_inventory (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      type         TEXT NOT NULL,
      plant_id     INTEGER,
      subspecies_id INTEGER,
      meta         TEXT,
      quantity     INTEGER DEFAULT 1,
      tradeable    INTEGER DEFAULT 1,
      created_at   TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `)
}

function createGardenTrades(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS garden_trades (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      item_id   INTEGER,
      price     INTEGER NOT NULL,
      status    TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (seller_id) REFERENCES users(user_id),
      FOREIGN KEY (item_id) REFERENCES garden_inventory(id) ON DELETE SET NULL
    )
  `)
}

function seedDefaultPlants(db: Database): void {
  const count = db.query("SELECT COUNT(*) as cnt FROM garden_plants").get() as { cnt: number } | undefined
  if (count && count.cnt > 0) return

  const plants = [
    { id: 1, name: "🌻 Подсолнух", description: "Классика. Растёт быстро, продаётся дёшево", seed_price: 50, growth_sec: 1200, max_level: 3 },
    { id: 2, name: "🌹 Роза", description: "Изящный цветок. Ценится выше", seed_price: 150, growth_sec: 1800, max_level: 3 },
    { id: 3, name: "🍅 Помидор", description: "Сочный и полезный", seed_price: 80, growth_sec: 1200, max_level: 3 },
    { id: 4, name: "🌵 Кактус", description: "Неприхотливый, но редкий", seed_price: 300, growth_sec: 3600, max_level: 5 },
    { id: 5, name: "🍀 Клевер", description: "Приносит удачу", seed_price: 250, growth_sec: 1500, max_level: 4 },
    { id: 6, name: "🌸 Сакура", description: "Цветёт мгновение, но прекрасна", seed_price: 500, growth_sec: 5400, max_level: 5 },
    { id: 7, name: "🌈 Радужная роза", description: "Легендарный цветок, меняющий цвет", seed_price: 1000, growth_sec: 10800, max_level: 7 },
  ]

  const insert = db.prepare(
    "INSERT OR IGNORE INTO garden_plants (id, name, description, seed_price, growth_sec, max_level) VALUES (?, ?, ?, ?, ?, ?)",
  )

  for (const p of plants) {
    insert.run(p.id, p.name, p.description, p.seed_price, p.growth_sec, p.max_level)
  }
}

function seedDefaultSubspecies(db: Database): void {
  const count = db.query("SELECT COUNT(*) as cnt FROM garden_subspecies").get() as { cnt: number } | undefined
  if (count && count.cnt > 0) return

  const subspecies = [
    { plant_id: 1, name: "Обычный", rarity: "common", emoji: "🌻", price_mult: 1.0, growth_mult: 1.0, germination_chance: 0.80, discover_weight: 10 },
    { plant_id: 1, name: "🔴 Красный", rarity: "uncommon", emoji: "🔴", price_mult: 1.2, growth_mult: 0.9, germination_chance: 0.85, discover_weight: 10 },
    { plant_id: 1, name: "🟠 Оранжевый", rarity: "rare", emoji: "🟠", price_mult: 1.5, growth_mult: 0.8, germination_chance: 0.90, discover_weight: 10 },
    { plant_id: 1, name: "🟡 Махровый", rarity: "epic", emoji: "🟡", price_mult: 2.0, growth_mult: 0.7, germination_chance: 0.95, discover_weight: 10 },
    { plant_id: 2, name: "Обычная", rarity: "common", emoji: "🌹", price_mult: 1.0, growth_mult: 1.0, germination_chance: 0.80, discover_weight: 10 },
    { plant_id: 2, name: "🤍 Белая", rarity: "uncommon", emoji: "🤍", price_mult: 1.2, growth_mult: 0.9, germination_chance: 0.85, discover_weight: 10 },
    { plant_id: 2, name: "💙 Синяя", rarity: "rare", emoji: "💙", price_mult: 1.5, growth_mult: 0.8, germination_chance: 0.90, discover_weight: 10 },
    { plant_id: 2, name: "🖤 Чёрная", rarity: "epic", emoji: "🖤", price_mult: 2.0, growth_mult: 0.7, germination_chance: 0.95, discover_weight: 10 },
    { plant_id: 3, name: "Обычный", rarity: "common", emoji: "🍅", price_mult: 1.0, growth_mult: 1.0, germination_chance: 0.80, discover_weight: 10 },
    { plant_id: 3, name: "🟡 Жёлтый", rarity: "uncommon", emoji: "🟡", price_mult: 1.2, growth_mult: 0.9, germination_chance: 0.85, discover_weight: 10 },
    { plant_id: 3, name: "🟢 Зелёный", rarity: "rare", emoji: "🟢", price_mult: 1.5, growth_mult: 0.8, germination_chance: 0.90, discover_weight: 10 },
    { plant_id: 3, name: "🟣 Фиолетовый", rarity: "epic", emoji: "🟣", price_mult: 2.0, growth_mult: 0.7, germination_chance: 0.95, discover_weight: 10 },
    { plant_id: 4, name: "Обычный", rarity: "common", emoji: "🌵", price_mult: 1.0, growth_mult: 1.0, germination_chance: 0.80, discover_weight: 10 },
    { plant_id: 4, name: "🌸 Цветущий", rarity: "rare", emoji: "🌸", price_mult: 1.5, growth_mult: 0.85, germination_chance: 0.90, discover_weight: 10 },
    { plant_id: 4, name: "🌵 Золотой", rarity: "epic", emoji: "🌟", price_mult: 2.0, growth_mult: 0.75, germination_chance: 0.95, discover_weight: 10 },
    { plant_id: 5, name: "Обычный", rarity: "common", emoji: "🍀", price_mult: 1.0, growth_mult: 1.0, germination_chance: 0.80, discover_weight: 10 },
    { plant_id: 5, name: "🍀 Четырёхлистный", rarity: "rare", emoji: "🍀", price_mult: 1.5, growth_mult: 0.85, germination_chance: 0.90, discover_weight: 10 },
    { plant_id: 5, name: "🌟 Пятилистный", rarity: "epic", emoji: "🌟", price_mult: 2.0, growth_mult: 0.75, germination_chance: 0.95, discover_weight: 10 },
    { plant_id: 6, name: "Обычная", rarity: "common", emoji: "🌸", price_mult: 1.0, growth_mult: 1.0, germination_chance: 0.80, discover_weight: 10 },
    { plant_id: 6, name: "🌸 Плакучая", rarity: "epic", emoji: "🌸", price_mult: 1.8, growth_mult: 0.8, germination_chance: 0.95, discover_weight: 10 },
    { plant_id: 6, name: "🌸 Морозная", rarity: "legendary", emoji: "❄️", price_mult: 2.5, growth_mult: 0.6, germination_chance: 0.99, discover_weight: 10 },
    { plant_id: 7, name: "Обычная", rarity: "common", emoji: "🌈", price_mult: 1.0, growth_mult: 1.0, germination_chance: 0.80, discover_weight: 10 },
    { plant_id: 7, name: "✨ Сияющая", rarity: "epic", emoji: "✨", price_mult: 1.8, growth_mult: 0.8, germination_chance: 0.95, discover_weight: 10 },
    { plant_id: 7, name: "👑 Королевская", rarity: "legendary", emoji: "👑", price_mult: 3.0, growth_mult: 0.5, germination_chance: 0.99, discover_weight: 10 },
  ]

  const insert = db.prepare(
    `INSERT OR IGNORE INTO garden_subspecies
     (plant_id, name, rarity, emoji, price_mult, growth_mult, germination_chance, discover_weight)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )

  for (const s of subspecies) {
    insert.run(s.plant_id, s.name, s.rarity, s.emoji, s.price_mult, s.growth_mult, s.germination_chance, s.discover_weight)
  }
}
