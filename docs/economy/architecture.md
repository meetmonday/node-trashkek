# Архитектура модулей

```
sql.ts (createDbApi)
├── balance.*
├── users.*
├── transactions.*
├── stats.*
├── chatUsers.*
├── pools.*
├── burned.*
├── meta.*
└── .raw                      ← bun:sqlite Database

BipBank (bipbank.ts)
├── DbApi                     ← все SQL через неймспейс
├── PoolManager               ← pools.*
├── Stabilizer                ← stabilizer.*
├── AdminManager              ← admin.*
├── StatsQueries              ← stats.*
├── DatabaseManager           ← backupDb
└── core methods              ← balance, deposit, withdraw, transfer, burn,
                                rainDistribute, getUser, updateUser,
                                setUsername, findByUsername, clearAll, close
```

Все модули получают зависимости через конструктор (нет циклических зависимостей).
Синглтон `bipbank` — единственная точка входа.

## Docker / Persistence

- `docker-compose.yaml` — `volumes: ./data:/usr/src/app/data`
- `data/` в `.gitignore` и `.dockerignore`
- При первом запуске БД создаётся автоматически

## Переменные окружения

- `BIPKI_DB_PATH` — путь к БД (по умолчанию `data/bipki.db`)
- `ADMIN_IDS` — список ID админов через запятую (по умолчанию `187365207`)

## Тесты

```
bun test tests/bipki.test.ts
```

- Используют `BIPKI_DB_PATH=:memory:`
- `@gramio/test` для эмуляции Telegram API
- `bipbank.clearAll()` в `beforeEach` для изоляции
- `textOf()` хелпер для извлечения текста ответа
