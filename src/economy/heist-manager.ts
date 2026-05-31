import type { DbApi } from './sql'

const LOCK_TIMEOUT_MS = 60000
const VAULT_KEY = 'vault_balance'
const COOLDOWN_PREFIX = 'heist_cooldown:'
const COOLDOWN_FAIL_MS = 2 * 60 * 60 * 1000
const COOLDOWN_SUCCESS_MS = 24 * 60 * 60 * 1000

export class HeistManager {
  private db: DbApi
  private _lock: { userId: number; startedAt: number } | null = null

  constructor(db: DbApi) {
    this.db = db
  }

  get vaultBalance(): number {
    const val = this.db.meta.get(VAULT_KEY)
    return val ? parseInt(val, 10) : 0
  }

  private setVaultBalance(value: number): void {
    this.db.meta.set(VAULT_KEY, String(Math.max(0, value)))
  }

  addToVault(amount: number): void {
    if (amount <= 0) return
    this.setVaultBalance(this.vaultBalance + amount)
  }

  takeFromVault(amount: number): number {
    if (amount <= 0) return 0
    const current = this.vaultBalance
    const taken = Math.min(amount, current)
    this.setVaultBalance(current - taken)
    return taken
  }

  get isLocked(): boolean {
    if (!this._lock) return false
    if (Date.now() - this._lock.startedAt > LOCK_TIMEOUT_MS) {
      this._lock = null
      return false
    }
    return true
  }

  get lockUserId(): number | null {
    return this._lock?.userId ?? null
  }

  acquireLock(userId: number): boolean {
    if (this.isLocked) return false
    this._lock = { userId, startedAt: Date.now() }
    return true
  }

  releaseLock(): void {
    this._lock = null
  }

  getCooldown(userId: number): number {
    const val = this.db.meta.get(COOLDOWN_PREFIX + userId)
    if (!val) return 0
    const expiresAt = parseInt(val, 10)
    if (Date.now() >= expiresAt) {
      this.db.meta.delete(COOLDOWN_PREFIX + userId)
      return 0
    }
    return expiresAt - Date.now()
  }

  setCooldown(userId: number, success: boolean): void {
    const duration = success ? COOLDOWN_SUCCESS_MS : COOLDOWN_FAIL_MS
    const expiresAt = String(Date.now() + duration)
    this.db.meta.set(COOLDOWN_PREFIX + userId, expiresAt)
  }

  maxUserBalance(excludeUserId?: number): number {
    const row = this.db.raw.query(
      excludeUserId
        ? 'SELECT MAX(balance) as m FROM users WHERE user_id != ?'
        : 'SELECT MAX(balance) as m FROM users',
      excludeUserId ? [excludeUserId] : [],
    ).get() as { m: number | null } | undefined
    return row?.m ?? 0
  }

  payoutCeiling(excludeUserId?: number): number {
    return Math.max(this.maxUserBalance(excludeUserId), 2000)
  }

  calculateReward(vaultAmount: number, stagesPassed: number): number {
    const base = vaultAmount * (stagesPassed / 3)
    const limit = 500 + Math.floor(vaultAmount * 0.2)
    return Math.min(Math.floor(base), limit)
  }

  initVault(): void {
    const val = this.db.meta.get(VAULT_KEY)
    if (val === null) {
      const row = this.db.raw.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 8 AND from_user_id IS NOT NULL',
      ).get() as { total: number } | undefined
      const seed = row?.total ?? 0
      this.setVaultBalance(seed)
    }
  }

  clear(): void {
    this._lock = null
    this.initVault()
  }
}
