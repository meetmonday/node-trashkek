import type { DbApi } from './sql'
import { TX_TYPE } from './types'

const LOCK_TIMEOUT_MS = 60000
const LOCK_KEY = 'heist_lock'
const VAULT_KEY = 'vault_balance'
const COOLDOWN_PREFIX = 'heist_cooldown:'
const COOLDOWN_FAIL_MS = 2 * 60 * 60 * 1000
const COOLDOWN_SUCCESS_MS = 24 * 60 * 60 * 1000
const GAMBLING_BURN_RATE = 0.02
const VAULT_BURN_RATE = 0.3

interface HeistLock {
  userId: number
  startedAt: number
}

function readLock(raw: string | null): HeistLock | null {
  if (!raw) return null
  try { return JSON.parse(raw) as HeistLock } catch { return null }
}

export class HeistManager {
  private db: DbApi

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

  processGamblingLoss(bet: number): void {
    if (bet <= 0) return
    const burn = Math.ceil(bet * GAMBLING_BURN_RATE)
    const vaultPart = bet - burn
    if (vaultPart > 0) this.addToVault(vaultPart)
  }

  burnVaultReserve(): number {
    const current = this.vaultBalance
    if (current <= 0) return 0
    const toBurn = Math.floor(current * VAULT_BURN_RATE)
    if (toBurn <= 0) return 0
    this.setVaultBalance(current - toBurn)
    this.db.transactions.insert({ amount: toBurn, type: TX_TYPE.fee, description: 'vault burn after heist' })
    return toBurn
  }

  takeFromVault(amount: number): number {
    if (amount <= 0) return 0
    const current = this.vaultBalance
    const taken = Math.min(amount, current)
    this.setVaultBalance(current - taken)
    return taken
  }

  private readLock(): HeistLock | null {
    const raw = this.db.meta.get(LOCK_KEY)
    return readLock(raw)
  }

  private writeLock(lock: HeistLock | null): void {
    if (lock) {
      this.db.meta.set(LOCK_KEY, JSON.stringify(lock))
    } else {
      this.db.meta.delete(LOCK_KEY)
    }
  }

  get isLocked(): boolean {
    const lock = this.readLock()
    if (!lock) return false
    if (Date.now() - lock.startedAt > LOCK_TIMEOUT_MS) {
      this.writeLock(null)
      return false
    }
    return true
  }

  get lockUserId(): number | null {
    return this.readLock()?.userId ?? null
  }

  acquireLock(userId: number): boolean {
    if (this.isLocked) return false
    this.writeLock({ userId, startedAt: Date.now() })
    return true
  }

  releaseLock(): void {
    this.writeLock(null)
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

  payoutCeiling(userBalance: number): number {
    return Math.max(userBalance * 2, 2000)
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
    this.writeLock(null)
    this.initVault()
  }
}
