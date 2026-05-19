# BipBank API

Единственная точка входа — синглтон `bipbank` из `@/economy`:

```ts
import { bipbank } from '@/economy'
```

---

## Баланс

```ts
bipbank.balance(userId: number): number
```

Автосоздаёт пользователя если нет. Возвращает текущий баланс.

## Начисление / списание

```ts
bipbank.deposit(to: number, amount: number, type: number, description?: string, systemDescription?: boolean): void
bipbank.withdraw(from: number, amount: number, type: number, description?: string, systemDescription?: boolean): boolean
```

- `deposit` — всегда успешно, кидает ошибку если `amount <= 0`.
- `withdraw` — возвращает `false` если не хватает баланса.
- `type` — одна из констант `TX_TYPE.*`.
- `systemDescription` — по умолчанию `true` (нормализовать). Для user-описаний передавать `false`.
- При `systemDescription !== false` описание сохраняется в `descriptions` таблицу; в транзакции хранится `description_id`.

`TxType` (числовые константы):

```ts
import { TX_TYPE, txTypeName } from '@/economy'

TX_TYPE.daily     // 1
TX_TYPE.transfer  // 2
TX_TYPE.burn      // 3
TX_TYPE.rain      // 4
TX_TYPE.work      // 5
TX_TYPE.admin     // 6
TX_TYPE.fee       // 7
TX_TYPE.gambled   // 8

txTypeName(7)     // 'fee'
```

## Перевод с комиссией

```ts
bipbank.transfer(from: number, to: number, amount: number, description?: string): TransferResult
```

- **Основная транзакция** (`type = transfer`): хранит `description` inline (user-описание, не нормализуется).
- **Комиссия 5%** (ceil) сгорает и записывается как `type = fee` с `parent_tx_id = id` основной транзакции. Описания не имеет — контекст читается из родителя.
- Если комиссия >= amount (микро-переводы), комиссия обнуляется.
- Кидает `Error('Insufficient balance')` если не хватает.
- Кидает `Error('Cannot transfer to yourself')` при переводе самому себе.

```ts
interface TransferResult {
  sent: number      // списано с отправителя
  received: number  // получено получателем
  fee: number       // сгорело
}
```

**Отображение в `/history`**: транзакция и комиссия показываются одной строкой:
```
💸 -100 → user456 — 2 мин. назад (комиссия: 5)
```

## Сжигание

```ts
bipbank.burn(userId: number, amount: number): void
```

Списывает `amount` и увеличивает `total_burned`.
Кидает `Error('Insufficient balance')` если не хватает.

## Дождь (атомарная раздача)

```ts
bipbank.rainDistribute(
  from: number,
  recipients: Array<{ userId: number; amount: number }>,
  fee: number,
  description?: string,
): RainDistributeResult
```

Атомарная операция: withdraw у `from` → deposit каждому → комиссия (`type = fee`) с `parent_tx_id = id` дождя и `total_burned += fee`.

```ts
interface RainDistributeResult {
  sent: number
  fee: number
  recipients: Array<{ userId: number; amount: number }>
}
```

Кидает `Error('Insufficient balance')` или `Error('Recipients list is empty')`.

## Стабилизатор экономики

Автоматически регулирует выплаты `/work` и `/daily` в зависимости от `totalSupply`.

```ts
bipbank.stabilizer.coeff: number              // текущий коэффициент [0.5, 1.5]
bipbank.stabilizer.getWorkAmount(): number     // Math.max(1, round(rand(5,40) * coeff))
bipbank.stabilizer.getDailyBaseAmount(streak): number  // round(10 * coeff) + STREAK_BONUS[streak]
```

Формула:

```
activeUsers  = COUNT(DISTINCT user_id в транзакциях за 7 дней)
inactiveUsers = userCount - activeUsers
targetSupply = 2000 × max(1, activeUsers) + 500 × inactiveUsers
total        = userCount > 0 ? totalSupply : 0
ratio        = total / targetSupply - 1
coeff        = clamp(1.0 - ratio, 0.5, 1.5)   // пересчёт раз в 6ч
```

- Streak bonus не режется коэффициентом.
- При coeff ≠ 1 команды показывают уведомление.
- Guard `userCount > 0` предотвращает деление на ноль.

## Призовые пулы (PoolManager)

```ts
bipbank.pools.contribute(chatId, poolId, userId, amount): void
bipbank.pools.refund(chatId, poolId): number
bipbank.pools.award(chatId, poolId, winnerId): number
bipbank.pools.split(chatId, poolId, recipients): { distributed: number; fee: number }
bipbank.pools.burn(chatId, poolId): number
bipbank.pools.status(chatId, poolId): { total: number; participants: Array<...> } | null
bipbank.pools.restore(): PoolContribution[]
```

- Пул изолирован по `(chat_id, pool_id)`.
- Все операции атомарны (внутри `db.transaction()`).
- `contribute` — withdraw + запись в `game_pools` + `gambled`-транзакция с `description: "pool:{poolId}"`.
- `refund` — возврат всем + `gambled`-транзакции refund.
- `award` — весь пул победителю + `gambled`-транзакция win. Кидает `Error('Pool is empty')`.
- `split` — распределение между получателями + `gambled`-транзакции split. Разница — `fee`-транзакция с `description: "pool fee:{poolId}"` (inline, не нормализуется).
- `burn` — сжигает весь пул (`fee`-транзакция с `description: "pool burn:{poolId}"`), очищает.
- `status` — текущее состояние или `null`.
- `restore` — все строки из `game_pools` (для восстановления при старте).

## Установка баланса (админ)

```ts
bipbank.admin.setBalance(userId: number, amount: number, description?: string): void
```

Устанавливает точный баланс. Разница записывается как `admin`-транзакция (описание inline, не нормализуется).
Кидает `Error('Amount must be non-negative')` если `amount < 0`.

## Мета пользователя

```ts
bipbank.getUser(userId: number): UserRow
bipbank.updateUser(userId: number, updates: Partial<Pick<UserRow, 'streak' | 'last_daily' | 'last_work' | 'username'>>): void
bipbank.setUsername(userId: number, username: string | null): void
```

- `getUser` — автосоздаёт, возвращает полную строку.
- `updateUser` — частичное обновление мета-полей.
- `setUsername` — сохранить/обновить username.

## Поиск по юзернейму

```ts
bipbank.findByUsername(username: string): number | null
```

Case-insensitive поиск `user_id` по `username`. `null` если не найден.

## История транзакций

```ts
bipbank.history(userId: number, limit?: number): TransactionRow[]
```

По умолчанию 5, максимум 20. Транзакции где пользователь — отправитель ИЛИ получатель.

```ts
interface TransactionRow {
  id: number
  from_user_id: number | null
  to_user_id: number | null
  amount: number
  type: number            // TX_TYPE.*
  description: string | null   // resolved description
  created_at: number            // unix timestamp
  parent_tx_id: number | null   // для fee — id родительской транзакции
}
```

Комиссии (`parent_tx_id != null`) скрываются из списка: их сумма дописывается к родительской строке как `(комиссия: N)`.

## Топ

```ts
bipbank.top(chatId?: number, limit?: number): TopRow[]
```

- Без `chatId` — глобальный топ.
- С `chatId` — топ по чату (через `chat_users`).

## Глобальная экономика

```ts
bipbank.totalBurned(): number
bipbank.economyStats(): EconomyStats
```

```ts
interface EconomyStats {
  totalSupply: number        // SUM(balance)
  userCount: number
  activeUsers: number        // COUNT(DISTINCT user_id в tx за 7d)
  totalTransactions: number
  totalEarnedWork: number    // SUM work-депозитов
  totalEarnedDaily: number   // SUM daily-депозитов
  totalBurned: number        // SUM type IN (burn, fee)
  totalTransferred: number   // SUM type = transfer
  totalGambled: number       // SUM type = gambled AND from_user_id IS NOT NULL
}
```

`economyStats().totalBurned` и `totalBurned()` идентичны.

## Админ-транзакции

```ts
bipbank.admin.getTransactions(limit?: number): TransactionRow[]
```

По умолчанию 10, максимум 50. Последние `admin`-транзакции.

## Чат-участники

```ts
bipbank.ensureChatUser(chatId: number, userId: number): void
bipbank.getChatUserIds(chatId: number): number[]
```

## Очистка (только :memory:)

```ts
bipbank.clearAll(): void
```

DELETE из всех таблиц + сброс кэша стабилизатора.
**Доступно только на `:memory:` базах** — на файловых кинет `Error`.

## Закрытие соединения

```ts
bipbank.close(): void
```

WAL checkpoint + закрытие `bun:sqlite` Database.

## Типы

```ts
import { TX_TYPE, txTypeName } from '@/economy'
import type {
  UserRow, TransactionRow, TopRow,
  TransferResult, RainDistributeResult, EconomyStats,
  PoolStatus, PoolContribution,
  DbApi,
} from '@/economy'
```

## Games Helper

Общие типы и утилиты для игровых команд (`/coinflip`, `/dice`, `/slots`).

```ts
import {
  sleep, MIN_BET, MAX_BET, MAX_LOG,
  parseGameBet, gameKey, gameKeyboard, newBet, deleteDiceMsg,
  gameTotalNet, renderGameHeader, renderGameLogLines,
  type GameBase, type GameLogEntry,
} from '@/helpers/games'
```

### Типы

```ts
interface GameBase {
  chatId: number
  messageId: number       // ID сообщения с кнопками
  creatorId: number       // кто создал игру
  creatorName: string     // display name создателя
  bet: number             // текущая ставка (10–500)
  closed: boolean         // игра завершена?
}

interface GameLogEntry {
  name: string            // кто сыграл
  display: string         // emoji результата (🎲/🎰/🦅)
  winName: string         // текстовый исход («Шестёрка!»/«Выиграл»)
  bet: number             // ставка в этом раунде
  payout: number          // выплата (0 при проигрыше)
}
```

### Утилиты

```ts
sleep(ms: number): Promise<void>
```
Задержка. Используется для паузы 2 с после `sendDice` (ожидание анимации).

```ts
parseGameBet(raw: string | undefined): { bet: number; error?: string }
```
Парсит и валидирует ставку из аргумента команды. Минимум `MIN_BET` (10), максимум `MAX_BET` (500).

```ts
gameKey(chatId: number, messageId: number): string
```
Ключ `chatId:messageId` для Map игр. Уникален в пределах чата.

```ts
gameKeyboard(prefix: string, spinText: string, spinEmoji: string): object
```
Генерирует inline-клавиатуру для spin-игры:
- Кнопка действия (`🎲 Бросить` / `🎰 Крутить`), callback `{prefix}:spin`
- Кнопки `✖️ x2`, `➗ x0.5`, `🏁 Закрыть` с callback `{prefix}:{action}`

Для кастомной клавиатуры (coinflip с heads/tails) клавиатура задаётся вручную.

```ts
newBet(bet: number, action: 'double' | 'halve'): number
```
Удваивает/делит ставку, не выходя за [MIN_BET, MAX_BET].

```ts
deleteDiceMsg(bot, chatId, msgId): Promise<void>
```
Безопасно удаляет предыдущее сообщение sendDice при следующем спине или закрытии.

```ts
gameTotalNet(log: GameLogEntry[]): number
```
Сумма всех `payout - bet` по логу. Положительная — игрок в плюсе, отрицательная — в минусе.

### Рендеринг

```ts
renderGameHeader(emoji, title, game, suffix?, log?): string[]
```
Возвращает строки шапки:
```
{emoji} {title} | Ставка: {bet} бипок | {suffix?}
Создатель: {name}

(🚫 Игра завершена)
(💰 Игрок разбогател на +X бипок — если closed && log.length > 0)

```

```ts
renderGameLogLines(log: GameLogEntry[], creatorName?): string[]
```
Возвращает строки лога (последние 5 записей):
```
📋 Лог (последние 5):
{entry.name если не создатель}: {display} — {winName} ✅ +X
```

Каждый entry форматируется по `net = payout - bet`: `✅ +N`, `🔄 0`, `❌`.

### Константы

| Константа | Значение |
|-----------|----------|
| `MIN_BET` | 10 |
| `MAX_BET` | 500 |
| `MAX_LOG` | 20 |

Лог обрезается до `MAX_LOG + 10`, при превышении удаляются первые записи.

### Поток игры (на примере `/dice`)

1. `bot.command("dice")` — парсит ставку, создаёт `DiceGame`, сохраняет в Map, отправляет сообщение с `gameKeyboard('di', 'Бросить', '🎲')`.
2. `bot.on('callback_query')` — фильтр по префиксу `di:`:
   - `di:spin` — withdraw, `sendDice('🎲')`, пауза 2 с, decode value, расчёт выплаты, deposit, push в лог, edit message.
   - `di:close` — `closed = true`, удаление dice-сообщения, edit с итогом.
   - `di:double` / `di:halve` — изменение ставки создателем.
   - Иначе `next()` — пропуск следующему обработчику (важно: GramIO compose — Koa-цепочка).
3. Все игры (`dice`, `slots`, `coinflip`) следуют одному паттерну: Map → callback switch → withdraw → действие → deposit → log → render.
