# BipBank — внутренняя валюта

## Обзор

BipBank — модуль для управления внутренней валютой "бипки".  
Хранит балансы, транзакции и участников чатов в SQLite (`data/bipki.db`).

```
src/
├── bipbank.ts                  ← BipBank class (ядро)
└── commands/bipki/
    ├── shared.ts               ← ensureBipkiUser(ctx) — общий хелпер
    ├── balance.ts              ← /bipki [@user | reply | ID]
    ├── daily.ts                ← /daily
    ├── transfers.ts            ← /transfer @user N [comment] | N (reply)
    ├── work.ts                 ← /work
    ├── burn.ts                 ← /burn N
    ├── rain.ts                 ← /rain N
    ├── top.ts                  ← /top, /globaltop
    ├── coinflip.ts             ← /coinflip N (мультиплеер на инлайн-кнопках)
    ├── economy.ts              ← /economy
    ├── history.ts              ← /history [N]
    └── help.ts                 ← /bipkiHelp
```

---

## BipBank API

Единственная точка входа — синглтон `bipbank` из `@/bipbank`:

```ts
import { bipbank } from '@/bipbank'
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

- `totalBurned` — `COALESCE(SUM(total_burned), 0)` по всем пользователям (сожжённое через `/burn` + комиссии переводов и дождя).
- `economyStats` — возвращает:

```ts
interface EconomyStats {
  totalSupply: number        // SUM(balance)
  userCount: number          // COUNT(users)
  activeUsers: number        // COUNT(DISTINCT user_id in tx last 7d)
  totalTransactions: number  // COUNT(transactions)
  totalEarnedWork: number    // SUM work-депозитов
  totalEarnedDaily: number   // SUM daily-депозитов
  totalBurned: number        // SUM type IN ('burn', 'fee')
  totalTransferred: number   // SUM type='transfer'
  totalGambled: number       // SUM type='gambled' (только ставки)
}
```

### Стабилизатор экономики

Автоматически регулирует выплаты `/work` и `/daily` в зависимости от `totalSupply`.

```ts
bipbank.stabilizerCoeff: number       // текущий коэффициент [0.5, 1.5]
bipbank.getWorkAmount(): number       // max(1, round(rand(5,40) * coeff))
bipbank.getDailyBaseAmount(streak): number  // round(10 * coeff) + STREAK_BONUS[streak]
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

DELETE из всех таблиц. Используется в тестах между кейсами.

---

## Команды

| Команда | Описание |
|---|---|---|
| `/bipki [@user \| reply \| ID]` | Баланс (свой, по @username, reply, числовому ID) |
| `/daily` | Ежедневный бонус со streak и рандом-бонусом |
| `/coinflip N` | Создать мультиплеерную монетку. Инлайн-кнопки 🦅/🌿/🏁. Выигрыш: N × 1.95, проигрыш: N сгорает |
| `/transfer @user N [comment] \| N (reply)` | Перевод с комиссией 5%, опциональный комментарий |
| `/work` | Заработать 5–40 бипок (кулдаун 2ч, сумма зависит от стабилизатора) |
| `/burn N` | Сжечь бипки |
| `/rain N` | Дождь в чате — 5% сгорает, остаток 3–5 случайным |
| `/top` | Топ чата (username если есть, иначе userID). В личке — silent |
| `/globaltop` | Глобальный топ (маскированный ID: `****6789`) |
| `/economy` | Статистика экономики + коэффициент стабилизатора |
| `/history [N]` | Последние N операций (default 5, max 20, время относительное) |
| `/bipkiHelp` | Справка по всем командам |

### /daily — механика

```python
# База (день 1 = 10, каждый день стрика = фиксированный бонус):
База: 10 (умножается на stabilizerCoeff)
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
- Закрыть игру может только создатель (кнопка 🏁).
- После каждого хода сообщение обновляется: в лог (последние 5, сверху вниз) добавляется запись с ✅/❌.
- Алерт показывает: выбор → результат → ВЫИГРАЛ/ПРОИГРАЛ + текущий баланс.
- Игры хранятся в памяти (`Map`), теряются при рестарте бота — к БД бипковой экономики отношения не имеют.

### /transfer — комиссия

```
Отправитель платит: N
Получатель получает: N - ceil(N * 0.05)
Сгорает: ceil(N * 0.05)  (транзакция type='fee')
```

При N = 1 комиссия не взимается.

Комментарий: `/transfer @user 100 za pizza` — последнее число = сумма, всё после = комментарий (показывается в ответе).

### Стабилизатор — коэффициенты

Встроен в `BipBank`. Автоматически регулирует `/work` и `/daily`:

```
targetSupply = 2000 × userCount
ratio = (totalSupply - targetSupply) / targetSupply
coeff = clamp(1.0 - ratio, 0.5, 1.5)    // пересчёт раз в час
```

- `getWorkAmount()` — `Math.round(rand(5, 40) * coeff)`
- `getDailyBaseAmount(streak)` — `Math.round(BASE[streak] * coeff)`

Прозрачно: `/economy` показывает текущий коэффициент.

### /rain — распределение

```
Сумма: N
Сгорает: ceil(N * 0.05)  (транзакция type='fee')
Получают: 3–5 случайных участников чата (исключая отправителя)
Остаток делится случайными долями
```

Использует `bipbank.rainDistribute()` — атомарно: withdraw, deposits, fee burn в одной транзакции.

---

## Хелпер ensureBipkiUser

```ts
import { ensureBipkiUser } from '@/commands/bipki/shared'

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

Заменяет повторяющийся код во всех bipki-командах.

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
  type         TEXT NOT NULL,          -- daily|transfer|burn|rain|work|admin|fee
  description  TEXT,
  created_at   TEXT DEFAULT datetime('now')
)

chat_users (
  chat_id  INTEGER NOT NULL,
  user_id  INTEGER NOT NULL,
  PRIMARY KEY (chat_id, user_id)
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
import { bipbank } from '@/bipbank'

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

// Кэфф стабилизатора
const coeff = bipbank.stabilizerCoeff

// Работа с учётом стабилизатора
bipbank.deposit(userId, bipbank.getWorkAmount(), 'work', 'убрался')

// Daily с учётом стабилизатора
const dailyAmount = bipbank.getDailyBaseAmount(streak)

// Статистика экономики
const stats = bipbank.economyStats()
console.log(stats.totalBurned, stats.totalGambled)
```

### Типы

```ts
import type {
  UserRow, TransferResult, TopRow, TransactionRow,
  TxType, RainDistributeResult, EconomyStats,
} from '@/bipbank'
```

---

## Docker / Persistence

- `docker-compose.yaml` — `volumes: ./data:/usr/src/app/data`
- `data/` в `.gitignore` и `.dockerignore`
- При первом запуске БД создаётся автоматически

## Переменные окружения

- `BIPKI_DB_PATH` — путь к файлу БД (по умолчанию `data/bipki.db`)

---

## Тесты

```
bun test tests/bipki.test.ts   — 39 тестов
bun test tests/                — все 36 тестов
```

- Используют `BIPKI_DB_PATH=:memory:`
- `@gramio/test` для эмуляции Telegram API
- `bipbank.clearAll()` в `beforeEach` для изоляции
- `textOf()` хелпер для извлечения текста ответа из API-вызова
