# BipBank — внутренняя валюта

## Обзор

BipBank — модуль для управления внутренней валютой "бипки".
Хранит балансы, транзакции и участников чатов в SQLite (`data/bipki.db`).

```
src/
└── economy/
    ├── index.ts              ← re-exports
    ├── bipbank.ts            ← BipBank class (ядро)
    ├── types.ts              ← TxType, UserRow, TransactionRow, TopRow, TransferResult, EconomyStats
    ├── pool-manager.ts       ← PoolManager (contribute, refund, award, split, burn, status, restore)
    ├── stabilizer.ts         ← Stabilizer (coeff, getWorkAmount, getDailyBaseAmount)
    ├── admin-manager.ts      ← AdminManager (setBalance, getTransactions)
    ├── stats-queries.ts      ← StatsQueries (economyStats, totalBurned, top, history)
    ├── database-manager.ts   ← DatabaseManager (backupDb)
    ├── heist-manager.ts      ← HeistManager (bank vault, cracking)
    ├── charity-manager.ts    ← CharityManager (tax, income boost, withdraw)
    ├── arena-manager.ts      ← ArenaManager (weekly competition, prizes)
    └── sql.ts                ← DbApi: все SQL-запросы, rollback
```

## Быстрый старт

```ts
import { bipbank } from '@/economy'

bipbank.deposit(userId, 100, 'admin', 'Бонус')
const bal = bipbank.balance(userId)
```

## Документация

| Раздел | О чём |
|--------|-------|
| [api.md](api.md) | BipBank API reference — все методы, PoolManager, Stabilizer, типы; Games Helper |
| [commands.md](commands.md) | Пользовательские команды — /daily, /work, /coinflip, /dice, /slots, /transfer, /burn, /rain, /ngbet, /top и т.д. |
| [database.md](database.md) | Схема БД, sql.ts / DbApi, PRAGMA, бекапы |
| [architecture.md](architecture.md) | Модули, зависимости, Docker, env vars, тесты |

---

## Хелперы (src/helpers/shared.ts)

### ensureBipkiUser

```ts
import { ensureBipkiUser } from '@/helpers/shared'

export default (bot: BotType) =>
  bot.command("example", async (ctx: CmdCtx) => {
    const userId = ensureBipkiUser(ctx)
    if (!userId) return
    // userId гарантированно есть в БД, username сохранён
  })
```

Автоматически записывает `chat_users` (если есть `ctx.chat?.id`) и сохраняет `username`.

### pluralizeBipki

```ts
pluralizeBipki(1)   // → "бипка"
pluralizeBipki(2)   // → "бипки"
pluralizeBipki(5)   // → "бипок"
pluralizeBipki(11)  // → "бипок"
```

Склонение по правилам русского языка (1, 2-4, 5-20, 21+).

### safeReply

```ts
await safeReply(ctx, 'Ошибка')
// вместо try { await ctx.reply('Ошибка') } catch { /* ignore */ }
```

Безопасный `ctx.reply`, ловит и игнорирует ошибки отправки.

### userName

```ts
userName(ctx.from, userId)              // "Анонимус" или "user123"
userName(ctx.replyMessage?.from, to)    // имя из reply
userName(entity.user, entity.user.id)   // имя из text_mention
```

Извлекает имя из `first_name` / `username`, fallback `user${id}`.

### parsePositiveAmount

```ts
const { amount, error } = parsePositiveAmount(ctx.args)
if (error) { await ctx.reply(error); return }
// amount > 0
```

Парсит положительное целое из строки.

### resolveTarget

```ts
const { targetId, targetName } = resolveTarget(ctx)
```

Определяет целевого пользователя (в порядке приоритета):
1. **reply** — `ctx.replyMessage.from`
2. **text_mention** — `entity.type === 'text_mention'`
3. **mention** — `@username` через `bipbank.findByUsername()`

### randomlyDistribute

```ts
const userIds = bipbank.getChatUserIds(chatId).filter(id => id !== senderId)
const recipients = randomlyDistribute(userIds, totalAmount, Math.min(5, userIds.length))
// → [{ userId: 123, amount: 15 }, { userId: 456, amount: 20 }, ...]
```

Случайно распределяет сумму между N получателями. Возвращает `[]` если `< 2` кандидатов.
**Внимание:** принимает копию массива, не мутирует оригинал.

---

## Хелперы игр (src/helpers/games.ts)

Общие типы (`GameBase`, `GameLogEntry`) и утилиты для игровых команд:
`parseGameBet`, `gameKeyboard`, `renderGameHeader`, `renderGameLogLines`,
`gameTotalNet`, `newBet`, `deleteDiceMsg`, `sleep`.

Подробнее в [api.md](api.md#games-helper).
