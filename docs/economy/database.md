# База данных

Файл: `data/bipki.db` (настраивается через `BIPKI_DB_PATH`, для тестов `:memory:`)

---

## Таблицы

```sql
users (
  user_id      INTEGER PRIMARY KEY,
  balance      INTEGER DEFAULT 0,
  streak       INTEGER DEFAULT 0,
  last_daily   TEXT,                  -- YYYY-MM-DD
  last_work    TEXT,                  -- timestamp ms
  total_burned INTEGER DEFAULT 0,
  username     TEXT,
  created_at   TEXT DEFAULT datetime('now'),
  updated_at   TEXT DEFAULT datetime('now')
)

descriptions (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL UNIQUE           -- единственный экземпляр описания
)

transactions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id   INTEGER,             -- NULL для начислений
  to_user_id     INTEGER,             -- NULL для списаний
  amount         INTEGER NOT NULL,
  type           INTEGER NOT NULL,    -- 1..8 (TxType)
  description    TEXT,                -- inline для user-описаний
  description_id INTEGER REFERENCES descriptions(id),  -- для system-описаний
  parent_tx_id   INTEGER REFERENCES transactions(id),  -- комиссия → родитель
  created_at     INTEGER DEFAULT (unixepoch())
)

chat_users (
  chat_id  INTEGER NOT NULL,
  user_id  INTEGER NOT NULL,
  PRIMARY KEY (chat_id, user_id)
)

game_pools (
  chat_id INTEGER NOT NULL,
  pool_id TEXT    NOT NULL,
  user_id INTEGER NOT NULL,
  amount  INTEGER NOT NULL,
  PRIMARY KEY (chat_id, pool_id, user_id)
)

arena_scores (
  chat_id    INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  score      INTEGER NOT NULL DEFAULT 0,
  week_start TEXT    NOT NULL,
  PRIMARY KEY (chat_id, user_id, week_start)
)
```

## TxType — числовые константы

```typescript
export const TX_TYPE = {
  daily: 1, transfer: 2, burn: 3, rain: 4,
  work: 5, admin: 6, fee: 7, gambled: 8,
} as const
```

Обратное преобразование: `txTypeName(type: number): string`.

## Описания

- **System-описания** (сгенерированные кодом: `"Streak: 5"`, `"вынес мусор 🗑️"`, `"pool:ngbet"`) — нормализуются в таблицу `descriptions`, в транзакции хранится `description_id`.
- **User-описания** (комментарий перевода, причина админа) — хранятся inline в `description`.
- **Комиссии** (`type = 7`) — не нормализуются, не хранят описание. Привязаны к родительской транзакции через `parent_tx_id`.

Чтение: `COALESCE(d.text, t.description) as description` — работает с любыми данными.

## Индексы

Создаются в `initTables()`:

```sql
CREATE INDEX IF NOT EXISTS idx_tx_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_tx_type_created_at ON transactions(type, created_at);
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance);
```

## PRAGMA

Устанавливаются в конструкторе `BipBank`:

- `journal_mode = WAL`
- `busy_timeout = 5000`
- `foreign_keys = ON`
- `synchronous = FULL`
- `journal_size_limit = 268435456` (256 MiB)
- `cache_size = -64000` (64 MiB)

## sql.ts / DbApi

Все SQL-запросы в `src/economy/sql.ts`.

### Standalone функции

Принимают `Database` первым аргументом, можно вызывать внутри транзакций:

- `ensureUser`, `balanceOf`, `getUser`, `findUserIdByUsername`, `updateUser`, `setUsername`
- `incrementBalance`, `decrementBalance`, `setBalance`, `incrementBurned`
- `insertTx`, `getHistory`, `getAdminTxs`, `getTotalBurned`, `getEconomyStats`
- `getTop`, `ensureChatUser`, `getChatUserIds`
- `upsertPoolContribution`, `getPoolParticipants`, `getPoolTotalRaw`, `deletePool`, `getAllPools`
- `getArenaTop`, `upsertArenaScore`, `deleteArenaWeek`, `getArenaChats`, `getArenaScoreByChat`
- `initTables`, `migrateSchema`, `clearAll`

### Неймспейс-обёртка `createDbApi(db)`

```ts
const db = createDbApi(rawDatabase)

db.balance.of(userId)          // SELECT balance
db.balance.add(userId, 100)    // UPDATE balance + N
db.balance.sub(userId, 50)     // UPDATE balance - N
db.balance.set(userId, 200)    // UPDATE balance = N

db.users.ensure(userId)
db.users.get(userId)
db.users.update(userId, { streak: 5 })
db.users.setUsername(userId, 'name')
db.users.findByUsername('@name')

db.transactions.insert({ from_user_id, to_user_id, amount, type, description })
  // → number (id новой транзакции)
  // Поддерживает systemDescription, parentTxId
db.transactions.history(userId, limit)
db.transactions.admin(limit)

db.stats.totalBurned()
db.stats.economyStats()
db.stats.top(chatId?, limit)

db.chatUsers.ensure(chatId, userId)
db.chatUsers.userIds(chatId)

db.pools.upsertContribution(chatId, poolId, userId, amount)
db.pools.participants(chatId, poolId)
db.pools.totalRaw(chatId, poolId)
db.pools.delete(chatId, poolId)
db.pools.all()

db.burned.add(userId, amount)

db.meta.initTables()
db.meta.migrate()
db.meta.clearAll()

db.arena.top(chatId, week, limit?)      // → ArenaScoreRow[]
db.arena.upsertScore(chatId, userId, score, week)  // INSERT ON CONFLICT
db.arena.deleteWeek(week)               // очистка прошедшей недели
db.arena.chats(week)                    // → number[] (chat_id с очками за неделю)
db.arena.chatScore(chatId, week)        // → number (макс. очко в чате за неделю)

db.raw                              // bun:sqlite Database (escape hatch)
db.transaction(() => { ... })       // SQLite transaction
```

Все менеджеры получают `DbApi` через конструктор.

## Бекапы

`DatabaseManager.backupDb()` создаёт снепшоты через `VACUUM INTO`:

- Автоматически вызывается при старте `BipBank`.
- Хранит до 5 бекапов в `data/backups/bipki-{timestamp}.db`.
- Пропускается на `:memory:`.
- Пропускается если последний бекап уже актуален (mtime check).

## Миграция из старого формата

`scripts/migrate-db.ts` — конвертирует существующую БД:

- `type TEXT → INTEGER`
- `created_at TEXT → INTEGER (unixepoch)`
- Создаёт `descriptions`, нормализует system-описания (fee — исключены)
- Добавляет `description_id` и `parent_tx_id`
- Привязывает fee → transfer/rain по `from_user_id + created_at`

```bash
BIPKI_DB_PATH=data/bipki.db bun run scripts/migrate-db.ts
```
