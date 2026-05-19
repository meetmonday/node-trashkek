# BipBank — внутренняя валюта

## Обзор

BipBank — модуль для управления внутренней валютой "бипки".  
Хранит балансы, транзакции и участников чатов в SQLite (`data/bipki.db`).

```
src/
└── economy/
    ├── index.ts                ← re-exports: bipbank, types, классы
    ├── bipbank.ts              ← BipBank class (ядро: deposit, withdraw, transfer, burn, rainDistribute)
    ├── types.ts                ← TxType, UserRow, TransactionRow, TopRow, TransferResult, EconomyStats
    ├── pool-manager.ts         ← PoolManager (contribute, refund, award, split, status, restore)
    ├── stabilizer.ts           ← Stabilizer (coeff, getWorkAmount, getDailyBaseAmount)
    ├── admin-manager.ts        ← AdminManager (setBalance, getTransactions)
    ├── database-manager.ts     ← DatabaseManager (initTables, migrate, clearAll, ensureUser)
    └── stats-queries.ts        ← StatsQueries (economyStats, totalBurned, top, history)
```

---

## BipBank API

Единственная точка входа — синглтон `bipbank` из `@/economy`:

```ts
import { bipbank } from '@/economy'
```

Все методы документированы JSDoc в исходнике.  
Краткая справка:

### Баланс

```ts
bipbank.balance(userId: number): number
```

Автосоздаёт пользователя если нет. Возвращает текущий баланс.

### Начисление / списание

```ts
bipbank.deposit(to: number, amount: number, type: TxType, description?: string): void
bipbank.withdraw(from: number, amount: number, type: TxType, description?: string): boolean
```

- `deposit` — всегда успешно, кидает ошибку если `amount <= 0`.
- `withdraw` — возвращает `false` если не хватает баланса.

`TxType` — строка: `'daily' | 'transfer' | 'burn' | 'rain' | 'work' | 'admin' | 'fee' | 'gambled'`.

### Перевод с комиссией

```ts
bipbank.transfer(from: number, to: number, amount: number, description?: string): TransferResult
```

- Комиссия 5% (ceil) сгорает и записывается как отдельная транзакция `type='fee'` с инкрементом `total_burned`.
- Если комиссия >= amount (микро-переводы), комиссия обнуляется.
- Кидает `Error('Insufficient balance')` если не хватает.
- `description` сохраняется в транзакции перевода (комментарий).

`TransferResult`:
```ts
{ sent: number; received: number; fee: number }
```

### Сжигание

```ts
bipbank.burn(userId: number, amount: number): void
```

Списывает `amount` и увеличивает `total_burned`.  
Кидает `Error('Insufficient balance')` если не хватает.

### Дождь (атомарная раздача)

```ts
bipbank.rainDistribute(
  from: number,
  recipients: Array<{ userId: number; amount: number }>,
  fee: number,
  description?: string,
): RainDistributeResult
```

Атомарная операция: withdraw у `from` → deposit каждому получателю → fee записывается как `type='fee'` с `total_burned += fee`.

`RainDistributeResult`:
```ts
{ sent: number; fee: number; recipients: Array<{ userId: number; amount: number }> }
```

Кидает `Error('Insufficient balance')` или `Error('Recipients list is empty')`.

### Призовые пулы (PoolManager)

Универсальная абстракция для игр с общим банком.  
Пул создаётся по `(chat_id, pool_id)` — изолирован от других чатов и игр.

```ts
// Внести ставку (withdraw с user'а + запись в game_pools)
bipbank.pools.contribute(chatId: number, poolId: string, userId: number, amount: number): void

// Вернуть все ставки в пуле (deposit каждому, очистка пула)
bipbank.pools.refund(chatId: number, poolId: string): number

// Отдать весь пул одному победителю (deposit, очистка пула)
bipbank.pools.award(chatId: number, poolId: string, winnerId: number): number

// Разделить пул между получателями (deposit каждому, очистка пула).
// Разница между суммой пула и суммой получателей записывается как fee.
bipbank.pools.split(
  chatId: number,
  poolId: string,
  recipients: Array<{ userId: number; amount: number }>,
): { distributed: number; fee: number }

// Текущее состояние пула
bipbank.pools.status(chatId: number, poolId: string): {
  total: number
  participants: Array<{ userId: number; amount: number }>
} | null

// Восстановить все активные пулы из БД (на старте)
bipbank.pools.restore(): Array<{
  chatId: number; poolId: string; userId: number; amount: number
}>
```

- `contribute` кидает `Error('Insufficient balance')` если не хватает.
- `refund` возвращает 0 если пул пуст.
- `award` кидает `Error('Pool is empty')` если пул пуст.
- `split` кидает `Error('Pool is empty')` или `Error('Recipients list is empty')`.
- `status` возвращает `null` если пул пуст.
- `split` записывает разницу как `fee`-транзакцию, но **не обновляет** `users.total_burned`.
- Все pool-операции атомарны (внутри `db.transaction()`).

### Установка баланса (админ)

```ts
bipbank.admin.setBalance(userId: number, amount: number, description?: string): void
```

Устанавливает точный баланс пользователя. Разница записывается как `admin`-транзакция.  
Кидает `Error('Amount must be non-negative')` если `amount < 0`.

### Мета пользователя

```ts
bipbank.getUser(userId: number): UserRow
bipbank.updateUser(userId: number, updates: Partial<Pick<UserRow, 'streak' | 'last_daily' | 'last_work' | 'username'>>): void
bipbank.setUsername(userId: number, username: string | null): void
```

- `getUser` — автосоздаёт пользователя. Возвращает полную строку.
- `updateUser` — частичное обновление мета-полей (streak, даты, username).
- `setUsername` — сохранить/обновить юзернейм (для @mention resolution).

### Поиск по юзернейму

```ts
bipbank.findByUsername(username: string): number | null
```

Case-insensitive поиск user_id по username.  
Возвращает `null` если пользователь не найден (не взаимодействовал с ботом).

### История транзакций

```ts
bipbank.history(userId: number, limit?: number): TransactionRow[]
```

По умолчанию 5, максимум 20. Возвращает последние транзакции, где пользователь — отправитель ИЛИ получатель.

### Топ

```ts
bipbank.top(chatId?: number, limit?: number): TopRow[]
```

- Без `chatId` — глобальный топ.
- С `chatId` — топ по чату (через `chat_users`).
- `TopRow` содержит `user_id`, `balance`, `rank`, `username`.

### Глобальная экономика

```ts
bipbank.totalBurned(): number
bipbank.economyStats(): EconomyStats
```

- `totalBurned` — сумма по `transactions` для `type IN ('burn', 'fee')`.
- `economyStats` — возвращает:

```ts
interface EconomyStats {
  totalSupply: number        // SUM(balance)
  userCount: number          // COUNT(users)
  activeUsers: number        // COUNT(DISTINCT user_id in tx last 7d)
  totalTransactions: number  // COUNT(transactions)
  totalEarnedWork: number    // SUM work-депозитов
  totalEarnedDaily: number   // SUM daily-депозитов
  totalBurned: number        // SUM type IN ('burn', 'fee') (из transactions)
  totalTransferred: number   // SUM type='transfer'
  totalGambled: number       // SUM type='gambled' AND from_user_id IS NOT NULL (только ставки)
}
```

> **Важно:** `economyStats().totalBurned` и `totalBurned()` оба суммируют из `transactions` — идентичны.

### Админ-транзакции

```ts
bipbank.admin.getTransactions(limit?: number): TransactionRow[]
```

По умолчанию 10, максимум 50. Возвращает последние `admin`-транзакции.

### Стабилизатор экономики

Автоматически регулирует выплаты `/work` и `/daily` в зависимости от `totalSupply`.

```ts
bipbank.stabilizer.coeff: number              // текущий коэффициент [0.5, 1.5]
bipbank.stabilizer.getWorkAmount(): number     // max(1, round(rand(5,40) * coeff))
bipbank.stabilizer.getDailyBaseAmount(streak): number  // round(10 * coeff) + STREAK_BONUS[streak]
```

Формула:
```
activeUsers = COUNT(DISTINCT user_id в транзакциях за 7 дней)
inactiveUsers = totalUsers - activeUsers
targetSupply = 2000 × max(1, activeUsers) + 500 × inactiveUsers
ratio = totalSupply / targetSupply - 1
coeff = clamp(1.0 - ratio, 0.5, 1.5)    // пересчёт раз в 6ч
```

Правила:
- **activeUsers** — кто делал хоть одну транзакцию за 7 дней, остальные — inactive (меньший вес в target)
- **Streak bonus** не режется коэффициентом: `round(10 × coeff) + streakBonus[streak]`
- При coeff ≠ 1 команды `/work` и `/daily` показывают уведомление `📊 Экономика ×0.xx`
- Максимум: `Math.max(1, round(...))` — защита от нуля

- Мало денег в экономике → `coeff > 1` (стимуляция)
- Много денег → `coeff < 1` (аустер)

### Чат-участники

```ts
bipbank.ensureChatUser(chatId: number, userId: number): void
bipbank.getChatUserIds(chatId: number): number[]
```

- `ensureChatUser` — запоминает, что юзер есть в чате (для per-chat топа).
- `getChatUserIds` — список ID всех известных участников чата (используется в `/rain`).

### Очистка (для тестов)

```ts
bipbank.clearAll(): void
```

DELETE из всех таблиц (включая `game_pools`) + сброс кэша стабилизатора. Используется в тестах между кейсами.

---

## Команды

| Команда | Описание |
|---|---|---|
| `/bipki [@user \| reply \| ID]` | Баланс (свой, по @username, reply, числовому ID, text_mention) |
| `/daily` | Ежедневный бонус со streak и рандом-бонусом |
| `/coinflip N` | Создать мультиплеерную монетку (ставка 10–500). Инлайн-кнопки 🦅/🌿/🏁. Выигрыш: N × 1.95 |
| `/transfer @user N [comment] \| N (reply)` | Перевод с комиссией 5%, опциональный комментарий |
| `/work` | Заработать 5–40 бипок (кулдаун 2ч, сумма зависит от стабилизатора) |
| `/burn N` | Сжечь бипки |
| `/rain N` | Дождь в чате — 5% сгорает, остаток 2–5 случайным |
| `/ngbet [N \| cancel]` | Ставка в призовой пул NaganBet. Повторные вызовы добавляют к ставке |
| `/top` | Топ чата (username если есть, иначе userID). В личке — silent |
| `/globaltop` | Глобальный топ (маскированный ID: `****6789`) |
| `/economy` | Статистика экономики + коэффициент стабилизатора |
| `/history [N]` | Последние N операций (default 5, max 20, время относительное) |
| `/bipkiHelp` | Справка по всем командам |
| `/bbadmin @user \| reply +/-N [причина]` | Админ-команда: начисление/списание (требуется ADMIN_IDS) |

### /daily — механика

```python
# База (день 1 = 10, каждый день стрика = фиксированный бонус):
База: 10 (умножается на stabilizer.coeff)
Бонус стрика: [0, 10, 25, 35, 50, 60, 75]

# Рандом-бонус поверх базы + бонуса стрика:
+5   — 50%
+25  — 35%
+45  — 10%
+85  — 4%
+170 — 1%
```

- Streak увеличивается если `last_daily === вчера (UTC)`. Иначе сброс на 1.
- Повторный `/daily` в тот же день — одно сообщение, затем silent ignore.
- Сброс дня — по UTC (0:00).
- Коэффициент стабилизатора применяется только к базе (10), streak bonus не режется.

### /coinflip — мультиплеерная монетка

```
Команда: /coinflip N (создать игру со ставкой N)
Игра: инлайн-кнопки 🦅 Орёл / 🌿 Решка / 🏁 Закрыть
Ставка: N (фиксированная для всех игроков)
Выигрыш (50%): N × 1.95 (округление вверх)
Проигрыш (50%): N сгорает
House edge: 2.5%
```

- Игра создаётся в сообщении с кнопками. Любой участник чата может нажать кнопку и сыграть.
- Ставка: минимум 10, максимум 500 бипок.
- Закрыть игру может только создатель (кнопка 🏁).
- После каждого хода сообщение обновляется: в лог (последние 5, сверху вниз) добавляется запись с ✅/❌.
- Алерт показывает: выбор → результат → ВЫИГРАЛ/ПРОИГРАЛ + текущий баланс.
- Игры хранятся в памяти (`Map`, до 20 записей в логе), теряются при рестарте бота — к БД бипковой экономики отношения не имеют.

### /transfer — комиссия

```
Отправитель платит: N
Получатель получает: N - ceil(N * 0.05)
Сгорает: ceil(N * 0.05)  (транзакция type='fee')
```

При N = 1 комиссия не взимается.

Комментарий: `/transfer @user 100 za pizza` — последнее число = сумма, всё после = комментарий (показывается в ответе).

### Стабилизатор — коэффициенты

Встроен в `BipBank` (через `Stabilizer`). Автоматически регулирует `/work` и `/daily`:

```
activeUsers = COUNT(DISTINCT user_id в транзакциях за 7 дней)
inactiveUsers = totalUsers - activeUsers
targetSupply = 2000 × max(1, activeUsers) + 500 × inactiveUsers
ratio = totalSupply / targetSupply - 1
coeff = clamp(1.0 - ratio, 0.5, 1.5)    // пересчёт раз в 6ч
```

- `stabilizer.getWorkAmount()` — `Math.max(1, round(rand(5, 40) * coeff))`
- `stabilizer.getDailyBaseAmount(streak)` — `Math.max(1, round(10 * coeff)) + STREAK_BONUS[streak]`

Прозрачно: `/economy` показывает текущий коэффициент.

### /rain — распределение

```
Сумма: N
Сгорает: ceil(N * 0.05)  (транзакция type='fee')
Получают: 2–5 случайных участников чата (исключая отправителя)
Минимум: N >= 4 (после комиссии должно остаться ≥ 3 бипок)
Остаток делится случайными долями
```

Использует `bipbank.rainDistribute()` — атомарно: withdraw, deposits, fee burn в одной транзакции.

### /ngbet — призовой пул NaganBet

```
Команда: /ngbet N (поставить N бипок в банк чата)
       : /ngbet (показать свою ставку и общий банк)
       : /ngbet cancel (вернуть все ставки в чате)
Механика: бот мониторит сообщения @naganbot и @itisdj_bot
  — при смерти игрока (матч по 13 паттернам) извлекается @username
    — если пользователь есть в bipki → pool.award: весь банк ему
    — если нет → дождь: 5% сгорает, остаток 3–5 случайным участникам чата (минимум 3 получателя)
  — при ядерном взрыве (3 паттерна) все проиграли → дождь: 5% сгорает, остаток 3–5
  — если < 3 получателей для дождя — банк сгорает целиком
  — пул очищается
Персистентность: ставки сохраняются в game_pools, восстанавливаются при рестарте
```

Использует `Pool API` (`pools.contribute` / `pools.award` / `pools.split` / `pools.refund`).

---

## Хелперы

### ensureBipkiUser

```ts
import { ensureBipkiUser } from '@/helpers/shared'

export default (bot: BotType) =>
  bot.command("example", async (ctx: any) => {
    const userId = ensureBipkiUser(ctx)
    if (!userId) return
    // userId гарантированно есть в БД, username сохранён
  })
```

Автоматически:
- Записывает `chat_users` (если есть `ctx.chat?.id`)
- Сохраняет/обновляет `username` в `users`

Заменяет повторяющийся код во всех bipki-командах. Файл: `src/helpers/shared.ts`.

### pluralizeBipki

```ts
import { pluralizeBipki } from '@/helpers/shared'

pluralizeBipki(1)   // → "бипка"
pluralizeBipki(2)   // → "бипки"
pluralizeBipki(5)   // → "бипок"
pluralizeBipki(11)  // → "бипок"
```

Склонение слова "бипки" по правилам русского языка (1, 2-4, 5-20, 21+).

### safeReply

```ts
import { safeReply } from '@/helpers/shared'

await safeReply(ctx, 'Ошибка')
// вместо try { await ctx.reply('Ошибка') } catch { /* ignore */ }
```

Безопасный `ctx.reply` — ловит и игнорирует ошибки отправки. Заменяет паттерн `ctx.reply('...').catch(() => {})` во всех командах.

### userName

```ts
import { userName } from '@/helpers/shared'

userName(ctx.from, userId)              // "Анонимус" или "user123"
userName(ctx.replyMessage?.from, to)    // имя из reply
userName(entity.user, entity.user.id)   // имя из text_mention
```

Извлекает имя пользователя из объекта с полями `first_name` / `username`. Если оба отсутствуют — возвращает `user${fallbackId}`.

Заменяет повторяющийся паттерн `obj.first_name || obj.username || \`user${id}\``.

### parsePositiveAmount

```ts
import { parsePositiveAmount } from '@/helpers/shared'

const { amount, error } = parsePositiveAmount(ctx.args)
if (error) {
  await ctx.reply(error)
  return
}
// amount гарантированно > 0
```

Парсит положительное целое число из строки. Возвращает `{ amount }` при успехе или `{ amount: 0, error: 'Сумма должна быть положительным числом' }` при неудаче.

### resolveTarget

```ts
import { resolveTarget } from '@/helpers/shared'

const { targetId, targetName } = resolveTarget(ctx)
if (targetId) {
  // найден через reply, text_mention, или @mention
}
```

Определяет целевого пользователя из контекста команды. Проверяет (в порядке приоритета):
1. **reply** — `ctx.replyMessage.from`
2. **text_mention** — `entity.type === 'text_mention'`
3. **mention** — `@username` через `bipbank.findByUsername()`

Возвращает `{ targetId, targetName }` или `{ targetId: null, targetName: '' }`.

Заменяет ручной перебор `ctx.entities` в `balance.ts`, `admin.ts`, `transfers.ts`.

### randomlyDistribute

```ts
import { randomlyDistribute } from '@/helpers/shared'

const userIds = bipbank.getChatUserIds(chatId).filter(id => id !== senderId)
const recipients = randomlyDistribute(userIds, totalAmount, Math.min(5, userIds.length))
// → [{ userId: 123, amount: 15 }, { userId: 456, amount: 20 }, ...]
```

Случайно распределяет сумму между N получателями.
- Принимает массив ID, сумму, количество получателей
- Возвращает массив `{ userId, amount }` или `[]` если < 2 кандидатов
- Доли случайные, в сумме дают `totalAmount`

Используется в `/rain` и `/ngbet` для раздачи дождя.

---

## База данных

Файл: `data/bipki.db` (настраивается через `BIPKI_DB_PATH`, для тестов `:memory:`)

### Таблицы

```sql
users (
  user_id      INTEGER PRIMARY KEY,   -- Telegram user ID
  balance      INTEGER DEFAULT 0,     -- текущий баланс
  streak       INTEGER DEFAULT 0,     -- streak /daily
  last_daily   TEXT,                  -- дата последнего daily (YYYY-MM-DD)
  last_work    TEXT,                  -- timestamp последнего work (ms)
  total_burned INTEGER DEFAULT 0,     -- всего сожжено (burns + fees)
  username     TEXT,                  -- @username (для resolve @mention)
  created_at   TEXT DEFAULT datetime('now'),
  updated_at   TEXT DEFAULT datetime('now')
)

transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER,               -- NULL для начислений
  to_user_id   INTEGER,               -- NULL для списаний
  amount       INTEGER NOT NULL,
  type         TEXT NOT NULL,          -- daily|transfer|burn|rain|work|admin|fee|gambled
  description  TEXT,
  created_at   TEXT DEFAULT datetime('now')
)

chat_users (
  chat_id  INTEGER NOT NULL,
  user_id  INTEGER NOT NULL,
  PRIMARY KEY (chat_id, user_id)
)

game_pools (
  chat_id INTEGER NOT NULL,        -- Telegram chat ID
  pool_id TEXT    NOT NULL,        -- идентификатор игры ('ngbet', ...)
  user_id INTEGER NOT NULL,        -- Telegram user ID
  amount  INTEGER NOT NULL,        -- текущая ставка пользователя
  PRIMARY KEY (chat_id, pool_id, user_id)
)
```

### PRAGMA

- `journal_mode = WAL` — конкурентные чтения
- `busy_timeout = 5000` — избежать locked-ошибок
- `foreign_keys = ON`

---

## Интеграция в другие команды

Любая команда бота может использовать BipBank:

```ts
import { bipbank } from '@/economy'

// Начислить пользователю
bipbank.deposit(userId, 100, 'admin', 'Бонус за активность')

// Проверить баланс
const balance = bipbank.balance(userId)

// Списать (с проверкой)
if (bipbank.withdraw(userId, 50, 'admin', 'Покупка')) {
  // бипки списаны
}

// Перевод между пользователями
try {
  const { sent, received, fee } = bipbank.transfer(fromId, toId, amount, 'за пиццу')
} catch (e) {
  // недостаточно баланса
}

// Атомарная раздача (дождь)
try {
  const result = bipbank.rainDistribute(userId, recipients, fee)
} catch (e) {
  // недостаточно баланса
}

// Призовой пул
try {
  bipbank.pools.contribute(chatId, 'ngbet', userId, 100)  // withdraw + запись
} catch (e) {
  // недостаточно баланса
}

// Отменить и вернуть
const total = bipbank.pools.refund(chatId, 'ngbet')

// Наградить победителя
const pot = bipbank.pools.award(chatId, 'ngbet', winnerId)

// Разделить пул (дождь)
const { distributed, fee } = bipbank.pools.split(chatId, 'ngbet', recipients)

// Проверить состояние
const status = bipbank.pools.status(chatId, 'ngbet')
if (status) {
  console.log(status.total, status.participants.length)
}

// Восстановить пулы при старте
const pools = bipbank.pools.restore()

// Кэфф стабилизатора
const coeff = bipbank.stabilizer.coeff

// Работа с учётом стабилизатора
bipbank.deposit(userId, bipbank.stabilizer.getWorkAmount(), 'work', 'убрался')

// Daily с учётом стабилизатора
const dailyAmount = bipbank.stabilizer.getDailyBaseAmount(streak)

// Статистика экономики
const stats = bipbank.economyStats()
console.log(stats.totalBurned, stats.totalGambled)
```

### Типы

```ts
import type {
  UserRow, TransferResult, TopRow, TransactionRow,
  TxType, RainDistributeResult, EconomyStats,
} from '@/economy'
```

---

## Архитектура модулей

```
BipBank (bipbank.ts)
├── DatabaseManager     — initTables, migrate, clearAll, ensureUser
├── PoolManager         — pools.* (contribute, refund, award, split, status, restore)
├── Stabilizer          — stabilizer.* (coeff, getWorkAmount, getDailyBaseAmount)
├── AdminManager        — admin.* (setBalance, getTransactions)
├── StatsQueries        — stats.* (economyStats, totalBurned, top, history)
└── [core methods]      — balance, deposit, withdraw, transfer, burn, rainDistribute,
                          getUser, updateUser, setUsername, findByUsername,
                          ensureChatUser, getChatUserIds
```

Все модули получают зависимости через конструктор (нет циклических зависимостей).  
Синглтон `bipbank` — единственная точка входа.

---

## Docker / Persistence

- `docker-compose.yaml` — `volumes: ./data:/usr/src/app/data`
- `data/` в `.gitignore` и `.dockerignore`
- При первом запуске БД создаётся автоматически

## Переменные окружения

- `BIPKI_DB_PATH` — путь к файлу БД (по умолчанию `data/bipki.db`)
- `ADMIN_IDS` — список ID админов через запятую (для `/bbadmin`). По умолчанию `187365207`

---

## Тесты

```
bun test tests/bipki.test.ts
```

- Используют `BIPKI_DB_PATH=:memory:`
- `@gramio/test` для эмуляции Telegram API
- `bipbank.clearAll()` в `beforeEach` для изоляции
- `textOf()` хелпер для извлечения текста ответа из API-вызова
