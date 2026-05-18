import rand from '@/helpers/rand'
import type { EconomyStats } from './types'

export class Stabilizer {
  private _coeff = 1.0
  private _lastAt = 0
  private readonly _interval = 21_600_000

  constructor(
    private getStats: () => EconomyStats,
  ) {}

  private _recalc(): void {
    const s = this.getStats()
    const activeUsers = s.activeUsers || 0
    const inactiveUsers = Math.max(0, s.userCount - activeUsers)
    const targetSupply = 2000 * Math.max(1, activeUsers) + 500 * inactiveUsers
    const total = s.userCount > 0 ? s.totalSupply : 0
    const ratio = total / targetSupply - 1
    this._coeff = Math.max(0.5, Math.min(1.5, 1.0 - ratio))
    this._lastAt = Date.now()
  }

  get coeff(): number {
    if (Date.now() - this._lastAt > this._interval) {
      this._recalc()
    }
    return this._coeff
  }

  getWorkAmount(): number {
    const base = rand(5, 40)
    return Math.max(1, Math.round(base * this.coeff))
  }

  getDailyBaseAmount(streak: number): number {
    const BASE_FLAT = 10
    const STREAK_BONUS = [0, 10, 25, 35, 50, 60, 75]
    return Math.max(1, Math.round(BASE_FLAT * this.coeff)) + STREAK_BONUS[Math.min(streak, 7) - 1]!
  }

  reset(): void {
    this._coeff = 1.0
    this._lastAt = 0
  }
}
