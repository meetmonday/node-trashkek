import type { DbApi } from './sql'
import { TX_TYPE } from './types'
import type { CharityCollectResult } from './types'
import { CHARITY_BOOST_RATIO, MIN_BALANCE_FOR_WITHDRAW } from './types'

const COLLECTION_DATE_KEY = 'charity_last_date'
const WITHDRAW_COOLDOWN_KEY = 'charity_withdraw:'
const VAULT_KEY = 'charity_balance'

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function msUntilEndOfDay(): number {
  const now = Date.now()
  const end = new Date(now)
  end.setUTCHours(23, 59, 59, 999)
  return end.getTime() - now
}

function msUntilNextMidnight(): number {
  const now = Date.now()
  const next = new Date(now)
  next.setUTCDate(next.getUTCDate() + 1)
  next.setUTCHours(0, 0, 0, 0)
  return next.getTime() - now
}

export class CharityManager {
  private db: DbApi
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(db: DbApi) {
    this.db = db
  }

  get bankBalance(): number {
    const val = this.db.meta.get(VAULT_KEY)
    return val ? parseInt(val, 10) : 0
  }

  addToBank(amount: number): void {
    if (amount <= 0) return
    const current = parseInt(this.db.meta.get(VAULT_KEY) ?? '0', 10)
    this.db.meta.set(VAULT_KEY, String(current + amount))
  }

  isCollectionDue(): boolean {
    const last = this.db.meta.get(COLLECTION_DATE_KEY)
    return last !== todayUTC()
  }

  collect(): CharityCollectResult {
    const stats = this.db.raw.query(
      'SELECT COALESCE(AVG(CAST(balance AS REAL)), 0) as avg, COUNT(*) as cnt FROM users',
    ).get() as { avg: number; cnt: number }
    const avg = Math.round(stats.avg)
    let totalCollected = 0
    let payerCount = 0

    const richUsers = this.db.raw.query(
      'SELECT user_id, balance, charity_rate FROM users WHERE balance > ?',
    ).all(avg) as { user_id: number; balance: number; charity_rate: number }[]

    this.db.transaction(() => {
      for (const u of richUsers) {
        const effectiveRate = Math.max(u.charity_rate, this.getRequiredRate(u.balance))
        if (effectiveRate <= 0) continue
        const contribution = Math.floor(u.balance * effectiveRate / 100)
        if (contribution <= 0) continue
        this.db.balance.sub(u.user_id, contribution)
        this.db.transactions.insert({
          from_user_id: u.user_id,
          amount: contribution,
          type: TX_TYPE.charity,
          description: 'charity contribution',
        })
        const currentVault = parseInt(this.db.meta.get(VAULT_KEY) ?? '0', 10)
        this.db.meta.set(VAULT_KEY, String(currentVault + contribution))
        totalCollected += contribution
        payerCount++
      }
      this.db.meta.set(COLLECTION_DATE_KEY, todayUTC())
    })

    return { totalCollected, payerCount }
  }

  getLastCollectionDate(): string | null {
    return this.db.meta.get(COLLECTION_DATE_KEY)
  }

  getRequiredRate(balance: number): number {
    if (balance >= 4000) return 5
    if (balance >= 3000) return 4
    if (balance >= 2000) return 3
    if (balance >= 1000) return 2
    return 1
  }

  getRate(userId: number): number {
    const user = this.db.users.get(userId)
    if (!user) return 1
    const required = this.getRequiredRate(user.balance)
    return Math.max(user.charity_rate, required)
  }

  setRate(userId: number, rate: number): void {
    const user = this.db.users.get(userId)
    if (!user) { this.db.users.ensure(userId); return }
    const required = this.getRequiredRate(user.balance)
    if (rate < required) throw new Error(`Минимальная ставка для твоего баланса — ${required}%`)
    this.db.users.update(userId, { charity_rate: rate } as any)
  }

  ensureRate(userId: number): void {
    const user = this.db.users.get(userId)
    if (!user) return
    const required = this.getRequiredRate(user.balance)
    if (user.charity_rate < required) {
      this.db.users.update(userId, { charity_rate: required } as any)
    }
  }

  getPersonalCoeff(userId: number): number {
    const rate = this.getRate(userId)
    if (rate <= 1) return 1.0
    return 1.0 + (rate - 1) * CHARITY_BOOST_RATIO
  }

  canWithdraw(userId: number): { allowed: boolean; reason?: string } {
    const user = this.db.users.get(userId)
    if (!user) return { allowed: false, reason: 'Пользователь не найден' }
    if (user.balance >= MIN_BALANCE_FOR_WITHDRAW) {
      return { allowed: false, reason: `Твой баланс (${user.balance}) превышает лимит (${MIN_BALANCE_FOR_WITHDRAW}). Сначала потрать часть бипок` }
    }
    const cooldownKey = WITHDRAW_COOLDOWN_KEY + userId
    const lastWithdraw = this.db.meta.get(cooldownKey)
    if (lastWithdraw === todayUTC()) {
      return { allowed: false, reason: 'Забирать можно раз в день. Возвращайся завтра!' }
    }
    return { allowed: true }
  }

  withdraw(userId: number, fraction: 'quarter' | 'half' | 'ninety'): number {
    const check = this.canWithdraw(userId)
    if (!check.allowed) throw new Error(check.reason)

    const fractionMap = { quarter: 0.25, half: 0.5, ninety: 0.9 }
    const frac = fractionMap[fraction]
    let taken = 0

    this.db.transaction(() => {
      const vault = parseInt(this.db.meta.get(VAULT_KEY) ?? '0', 10)
      const amount = Math.floor(vault * frac)
      if (amount <= 0) return
      taken = amount
      this.db.meta.set(VAULT_KEY, String(vault - amount))
      this.db.balance.add(userId, amount)
      this.db.transactions.insert({
        to_user_id: userId,
        amount,
        type: TX_TYPE.charity,
        description: 'charity withdrawal',
      })
      this.db.meta.set(WITHDRAW_COOLDOWN_KEY + userId, todayUTC())
    })

    return taken
  }

  startScheduler(): void {
    this.scheduleNext()
  }

  stopScheduler(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private scheduleNext(): void {
    this.stopScheduler()

    const now = Date.now()
    const lastCollected = this.db.meta.get(COLLECTION_DATE_KEY)
    const today = todayUTC()

    let delay: number

    if (lastCollected === today) {
      delay = msUntilNextMidnight() + Math.random() * 24 * 60 * 60 * 1000
    } else {
      delay = Math.random() * msUntilEndOfDay()
    }

    if (delay < 1000) delay = 60_000

    this.timer = setTimeout(() => {
      try {
        this.collect()
      } catch (err) {
        console.error('[charity] collect error:', err)
      }
      this.scheduleNext()
    }, delay)
  }
}
