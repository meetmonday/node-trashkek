import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { createDbApi, type DbApi } from './sql'
import { PoolManager } from './pool-manager'
import { Stabilizer } from './stabilizer'
import { AdminManager } from './admin-manager'
import { DatabaseManager } from './database-manager'
import { StatsQueries } from './stats-queries'
import { HeistManager } from './heist-manager'
import { CharityManager } from './charity-manager'
import { TX_TYPE } from './types'
import type {
  TxType, UserRow, TransactionRow, TopRow, EconomyStats,
  TransferResult, RainDistributeResult,
} from './types'

function getDbPath(): string {
  return process.env.BIPKI_DB_PATH || 'data/bipki.db'
}

export class BipBank {
  private rawDb: Database
  private db: DbApi

  readonly pools: PoolManager
  readonly dbPath: string

  constructor() {
    this.dbPath = getDbPath()
    const dir = this.dbPath.lastIndexOf('/')
    if (dir > 0) {
      const dirPath = this.dbPath.slice(0, dir)
      if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true })
    }

    this.rawDb = new Database(this.dbPath)
    this.rawDb.run('PRAGMA journal_mode=WAL')
    this.rawDb.run('PRAGMA busy_timeout=5000')
    this.rawDb.run('PRAGMA foreign_keys=ON')
    this.rawDb.run('PRAGMA synchronous=FULL')
    this.rawDb.run('PRAGMA journal_size_limit=268435456')
    this.rawDb.run('PRAGMA cache_size=-64000')
    this.db = createDbApi(this.rawDb)
    this.db.meta.initTables()
    this.db.meta.migrate()
    this.dbManager = new DatabaseManager(this.rawDb, this.dbPath)
    this.dbManager.backupDb()

    this.pools = new PoolManager(this.db, this.rawDb)
    this.stats = new StatsQueries(this.db)
    this.stabilizer = new Stabilizer(() => this.stats.economyStats())
    this.admin = new AdminManager(this.db)
    this.heist = new HeistManager(this.db)
    this.heist.initVault()
    this.charity = new CharityManager(this.db)
    this.charity.startScheduler()
  }

  readonly stabilizer: Stabilizer
  readonly admin: AdminManager
  readonly stats: StatsQueries
  readonly heist: HeistManager
  readonly charity: CharityManager
  private dbManager: DatabaseManager

  ensureUser(userId: number): void {
    this.db.users.ensure(userId)
  }

  balance(userId: number): number {
    this.ensureUser(userId)
    return this.db.balance.of(userId)
  }

  deposit(
    to: number,
    amount: number,
    type: number,
    description?: string,
    systemDescription = true,
  ): number {
    if (amount <= 0) throw new Error('Amount must be positive')
    this.ensureUser(to)

    const penalty = this.charity.calculateIncomePenalty(to, amount, type)
    let effectiveAmount = amount - penalty
    const personalCoeff = this.charity.getPersonalCoeff(to)
    effectiveAmount = Math.round(effectiveAmount * personalCoeff)

    if (effectiveAmount <= 0) return 0

    this.db.transaction(() => {
      this.db.balance.add(to, effectiveAmount)
      this.db.transactions.insert({ to_user_id: to, amount: effectiveAmount, type, description, systemDescription })
      if (penalty > 0) {
        const currentVault = parseInt(this.db.meta.get('charity_balance') ?? '0', 10)
        this.db.meta.set('charity_balance', String(currentVault + penalty))
        this.db.transactions.insert({ from_user_id: to, amount: penalty, type: TX_TYPE.charity, description: 'income penalty (charity disabled)' })
      }
    })
    return effectiveAmount
  }

  withdraw(
    from: number,
    amount: number,
    type: number,
    description?: string,
    systemDescription = true,
  ): boolean {
    if (amount <= 0) throw new Error('Amount must be positive')
    this.ensureUser(from)

    return this.db.transaction(() => {
      const bal = this.db.balance.of(from)
      if (bal < amount) return false

      this.db.balance.sub(from, amount)
      this.db.transactions.insert({ from_user_id: from, amount, type, description, systemDescription })
      return true
    })
  }

  transfer(
    from: number,
    to: number,
    amount: number,
    description?: string,
  ): TransferResult {
    if (amount <= 0) throw new Error('Amount must be positive')
    if (from === to) throw new Error('Cannot transfer to yourself')
    this.ensureUser(from)
    this.ensureUser(to)

    return this.db.transaction(() => {
      const bal = this.db.balance.of(from)
      if (bal < amount) throw new Error('Insufficient balance')

      let fee = Math.ceil(amount * 0.05)
      if (fee >= amount) fee = 0
      const received = amount - fee

      this.db.balance.sub(from, amount)
      this.db.balance.add(to, received)
      const transferId = this.db.transactions.insert({ from_user_id: from, to_user_id: to, amount, type: TX_TYPE.transfer, description, systemDescription: false })

      if (fee > 0) {
        this.db.burned.add(from, fee)
        this.db.transactions.insert({ from_user_id: from, amount: fee, type: TX_TYPE.fee, parentTxId: transferId, systemDescription: false })
      }

      return { sent: amount, received, fee }
    })
  }

  rainDistribute(
    from: number,
    recipients: Array<{ userId: number; amount: number }>,
    fee: number,
    description?: string,
  ): RainDistributeResult {
    if (recipients.length === 0) throw new Error('Recipients list is empty')
    const total = recipients.reduce((s, r) => s + r.amount, 0) + fee
    if (total <= 0) throw new Error('Total amount must be positive')
    this.ensureUser(from)
    for (const r of recipients) this.ensureUser(r.userId)

    return this.db.transaction(() => {
      const bal = this.db.balance.of(from)
      if (bal < total) throw new Error('Insufficient balance')

      this.db.balance.sub(from, total)
      const rainId = this.db.transactions.insert({ from_user_id: from, amount: total, type: TX_TYPE.rain, description })

      for (const r of recipients) {
        this.db.balance.add(r.userId, r.amount)
        this.db.transactions.insert({ to_user_id: r.userId, amount: r.amount, type: TX_TYPE.rain })
      }

      if (fee > 0) {
        this.db.burned.add(from, fee)
        this.db.transactions.insert({ from_user_id: from, amount: fee, type: TX_TYPE.fee, parentTxId: rainId, systemDescription: false })
      }

      return { sent: total, fee, recipients }
    })
  }

  totalBurned(): number {
    return this.stats.totalBurned()
  }

  economyStats(): EconomyStats {
    return this.stats.economyStats()
  }

  burn(userId: number, amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive')
    this.ensureUser(userId)

    this.db.transaction(() => {
      const bal = this.db.balance.of(userId)
      if (bal < amount) throw new Error('Insufficient balance')

      this.db.balance.sub(userId, amount)
      this.db.burned.add(userId, amount)
      this.db.transactions.insert({ from_user_id: userId, amount, type: TX_TYPE.burn })
    })
  }

  getUser(userId: number): UserRow {
    this.ensureUser(userId)
    const row = this.db.users.get(userId)
    if (!row) throw new Error('User not found')
    return row
  }

  updateUser(
    userId: number,
    updates: Partial<
      Pick<UserRow, 'streak' | 'last_daily' | 'last_work' | 'username' | 'charity_rate'>
    >,
  ): void {
    this.db.users.update(userId, updates)
  }

  history(userId: number, limit = 5): TransactionRow[] {
    return this.db.transactions.history(userId, limit)
  }

  top(chatId?: number, limit = 10): TopRow[] {
    return this.db.stats.top(chatId, limit)
  }

  ensureChatUser(chatId: number, userId: number): void {
    this.db.chatUsers.ensure(chatId, userId)
  }

  getChatUserIds(chatId: number): number[] {
    return this.db.chatUsers.userIds(chatId)
  }

  setUsername(userId: number, username: string | null): void {
    this.ensureUser(userId)
    this.db.users.setUsername(userId, username)
  }

  clearAll(): void {
    if (this.dbPath !== ':memory:') {
      throw new Error('clearAll() is only available on in-memory databases')
    }
    this.charity.stopScheduler()
    this.db.meta.clearAll()
    this.stabilizer.reset()
    this.heist.clear()
  }

  findByUsername(username: string): number | null {
    return this.db.users.findByUsername(username)
  }

  close(): void {
    this.charity.stopScheduler()
    try {
      this.rawDb.exec('PRAGMA wal_checkpoint(TRUNCATE)')
    } catch {
    }
    this.rawDb.close()
  }
}

let _instance: BipBank | undefined

function getInstance(): BipBank {
  if (!_instance) _instance = new BipBank()
  return _instance
}

export const bipbank = new Proxy({} as BipBank, {
  get(_, prop) {
    return Reflect.get(getInstance(), prop, getInstance())
  },
  set(_, prop, value) {
    Reflect.set(getInstance(), prop, value)
    return true
  },
})
