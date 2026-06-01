import type { DbApi } from './sql'
import { TX_TYPE } from './types'

const PRIZE_LIMIT = 500
const TICK_INTERVAL_MS = 60 * 60 * 1000
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
const WEEK_KEY = 'arena:current_week'
const LEADER_KEY = 'arena:leader:'
const LEADER_SINCE_KEY = 'arena:leader_since:'
const THREE_DAY_ANNOUNCED = ':3day_done'

export interface ArenaEvent {
  chatId: number
  type: 'takeover' | 'week_start' | 'week_end' | 'leader_hold'
  week: string
  top: { userId: number; score: number }[]
  prizes?: { userId: number; amount: number }[]
}

export class ArenaManager {
  private db: DbApi
  private heist: { vaultBalance: number; takeFromVault(amount: number): number }
  private timer: ReturnType<typeof setTimeout> | null = null
  onEvent: ((event: ArenaEvent) => void) | null = null

  constructor(
    db: DbApi,
    heist: { vaultBalance: number; takeFromVault(amount: number): number },
  ) {
    this.db = db
    this.heist = heist
  }

  getWeekLabel(): string {
    const now = new Date()
    const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000)
    const weekNum = Math.ceil((days + jan1.getUTCDay() + 1) / 7)
    return `${now.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
  }

  addScore(chatId: number, userId: number, netDelta: number): ArenaEvent | null {
    if (netDelta <= 0) return null
    const week = this.getWeekLabel()

    this.db.arena.upsertScore(chatId, userId, netDelta, week)

    const top = this.db.arena.top(chatId, week, 3)
    if (top.length === 0) return null

    const lKey = LEADER_KEY + chatId
    const prevLeader = this.db.meta.get(lKey)
    const prevId = prevLeader ? parseInt(prevLeader, 10) : null

    const leader = top[0].user_id
    if (prevId !== leader) {
      this.db.meta.set(lKey, String(leader))
      this.db.meta.set(LEADER_SINCE_KEY + chatId, String(Date.now()))
      this.db.meta.delete(lKey + THREE_DAY_ANNOUNCED)
      if (prevId !== null) {
        return { chatId, type: 'takeover', week, top: this.normalizeTop(top) }
      }
      return null
    }

    const sinceRaw = this.db.meta.get(LEADER_SINCE_KEY + chatId)
    if (sinceRaw && !this.db.meta.get(lKey + THREE_DAY_ANNOUNCED)) {
      if (Date.now() - parseInt(sinceRaw, 10) >= THREE_DAYS_MS) {
        this.db.meta.set(lKey + THREE_DAY_ANNOUNCED, '1')
        return { chatId, type: 'leader_hold', week, top: this.normalizeTop(top) }
      }
    }

    return null
  }

  private normalizeTop(top: { user_id: number; score: number }[]): { userId: number; score: number }[] {
    return top.map(r => ({ userId: r.user_id, score: r.score }))
  }

  getTop(chatId: number, limit = 10): { userId: number; score: number }[] {
    return this.db.arena.top(chatId, this.getWeekLabel(), limit).map(r => ({
      userId: r.user_id,
      score: r.score,
    }))
  }

  getUserScore(chatId: number, userId: number): number {
    const top = this.db.arena.top(chatId, this.getWeekLabel(), 1000)
    return top.find(r => r.user_id === userId)?.score ?? 0
  }

  private distributePrizesForWeek(chatId: number, week: string): { userId: number; amount: number }[] {
    const top = this.db.arena.top(chatId, week, 3)
    if (top.length === 0 || top[0].score === 0) return []

    const vault = this.heist.vaultBalance
    const pool = Math.min(vault, PRIZE_LIMIT)
    if (pool <= 0) return []

    const shares = [0.5, 0.3, 0.2]
    const prizes: { userId: number; amount: number }[] = []

    this.db.transaction(() => {
      for (let i = 0; i < top.length; i++) {
        const amount = Math.floor(pool * shares[i])
        if (amount <= 0) continue
        const taken = this.heist.takeFromVault(amount)
        if (taken <= 0) continue
        this.db.balance.add(top[i].user_id, taken)
        this.db.transactions.insert({
          to_user_id: top[i].user_id,
          amount: taken,
          type: TX_TYPE.transfer,
          description: `arena prize #${i + 1} (week ${week})`,
        })
        prizes.push({ userId: top[i].user_id, amount: taken })
      }
    })

    return prizes
  }

  tick(): ArenaEvent[] {
    const week = this.getWeekLabel()
    const stored = this.db.meta.get(WEEK_KEY)
    if (stored === week) return []

    const events: ArenaEvent[] = []
    const prevChats = stored !== null ? this.db.arena.chats(stored) : []

    if (stored !== null) {
      for (const chatId of prevChats) {
        const raw = this.db.arena.top(chatId, stored, 3)
        if (raw.length === 0 || raw[0].score === 0) continue
        const prizes = this.distributePrizesForWeek(chatId, stored)
        if (prizes.length > 0) {
          events.push({
            chatId,
            type: 'week_end',
            week: stored,
            top: raw.map(r => ({ userId: r.user_id, score: r.score })),
            prizes,
          })
        }
      }
    }

    this.db.meta.set(WEEK_KEY, week)
    for (const chatId of prevChats) {
      events.push({ chatId, type: 'week_start', week, top: [] })
    }
    if (prevChats.length === 0) {
      events.push({ chatId: 0, type: 'week_start', week, top: [] })
    }

    return events
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
    this.timer = setTimeout(() => {
      try {
        const events = this.tick()
        if (this.onEvent) {
          for (const event of events) {
            try { this.onEvent(event) } catch {}
          }
        }
      } catch (err) {
        console.error('[arena] tick error:', err)
      }
      this.scheduleNext()
    }, TICK_INTERVAL_MS)
  }
}
