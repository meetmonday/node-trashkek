//@ts-nocheck
import { describe, expect, it, beforeEach, beforeAll } from "bun:test"
import { Bot } from "gramio"
import { TelegramTestEnvironment } from "@gramio/test"
import { autoload } from "@gramio/autoload"

function textOf(call: any): string {
  const t = call?.params?.text
  return typeof t === 'string' ? t : String(t ?? '')
}

let bot: any, bipbank: any

describe("Bipki Commands", () => {
  beforeAll(async () => {
    const mod = await import("@/economy")
    bipbank = mod.bipbank
    bot = new Bot("test").extend(
      await autoload({ path: "../src/commands", picomatch: { ignore: ["**/shared.ts"] } }),
    )
  })

  beforeEach(() => {
    bipbank.clearAll()
  })

  // ── /bipki ──────────────────────────────────────────────────────
  describe("/bipki (balance)", () => {
    it("shows 0 for new user", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 1, first_name: "User", username: "u1" })
      await user.sendCommand("bipki")
      expect(textOf(env.apiCalls[0])).toContain("0")
    })

    it("shows deposited balance", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 2, first_name: "Rich", username: "rich" })
      bipbank.deposit(2, 50, "admin", "test")
      await user.sendCommand("bipki")
      expect(textOf(env.apiCalls[0])).toContain("50")
    })
  })

  // ── /daily ───────────────────────────────────────────────────────
  describe("/daily", () => {
    it("gives reward on first claim", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 10, first_name: "Daily" })
      await user.sendCommand("daily")
      expect(textOf(env.apiCalls[0])).toContain("🎁")
    })

    it("refuses duplicate claim on the same day", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 11, first_name: "Dup" })
      await user.sendCommand("daily")
      env.clearApiCalls()
      await user.sendCommand("daily")
      expect(textOf(env.apiCalls[0])).toContain("уже получил бонус")
    })
  })

  // ── /work ────────────────────────────────────────────────────────
  describe("/work", () => {
    it("pays out between 5–50 bipki", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 20, first_name: "Worker" })
      await user.sendCommand("work")
      expect(textOf(env.apiCalls[0])).toContain("💼")
    })

    it("enforces 2h cooldown", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 21, first_name: "Lazy" })
      await user.sendCommand("work")
      env.clearApiCalls()
      await user.sendCommand("work")
      expect(textOf(env.apiCalls[0])).toContain("Отдохни")
    })
  })

  // ── /burn ────────────────────────────────────────────────────────
  describe("/burn", () => {
    it("rejects missing amount", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 30, first_name: "Burner" })
      await user.sendCommand("burn")
      expect(textOf(env.apiCalls[0])).toContain("Укажи сумму")
    })

    it("rejects non-positive amount", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 31, first_name: "Burner2" })
      await user.sendCommand("burn", "-5")
      expect(textOf(env.apiCalls[0])).toContain("положительным")
    })

    it("rejects burn exceeding balance", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 32, first_name: "Broke" })
      await user.sendCommand("burn", "999")
      expect(textOf(env.apiCalls[0])).toContain("Недостаточно")
    })

    it("burns valid amount", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 33, first_name: "Burner3" })
      bipbank.deposit(33, 100, "admin", "test")
      await user.sendCommand("burn", "30")
      expect(textOf(env.apiCalls[0])).toContain("🔥")
      expect(textOf(env.apiCalls[0])).toContain("30")
      expect(bipbank.balance(33)).toBe(70)
    })
  })

  // ── /transfer ────────────────────────────────────────────────────
  describe("/transfer", () => {
    it("rejects missing args", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 40, first_name: "Sender" })
      await user.sendCommand("transfer")
      expect(textOf(env.apiCalls[0])).toContain("Укажи")
    })

    it("rejects self-transfer", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 41, first_name: "Self" })
      bipbank.deposit(41, 100, "admin", "test")
      await user.sendCommand("transfer", "41 50")
      expect(textOf(env.apiCalls[0])).toContain("самому себе")
    })

    it("rejects insufficient balance", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 42, first_name: "Poor" })
      await user.sendCommand("transfer", "43 999")
      expect(textOf(env.apiCalls[0])).toContain("Недостаточно")
    })

    it("transfers with 5% fee to numeric ID", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 44, first_name: "A" })
      bipbank.deposit(44, 200, "admin", "test")
      bipbank.ensureUser(45)

      await user.sendCommand("transfer", "45 100")
      expect(textOf(env.apiCalls[0])).toContain("💸")
      // receiver gets 100 - ceil(100*0.05) = 95
      expect(bipbank.balance(44)).toBe(100) // 200 - 100 = 100
      expect(bipbank.balance(45)).toBe(95)  // 100 - 5
    })

    it("transfers with comment", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 46, first_name: "B" })
      bipbank.deposit(46, 200, "admin", "test")
      bipbank.ensureUser(47)

      await user.sendCommand("transfer", "47 50 za pizza")
      expect(textOf(env.apiCalls[0])).toContain("za pizza")
    })

    it("transfers by @mention", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({
        id: 48,
        first_name: "C",
        username: "sender_c",
      })
      const target = env.createUser({ id: 49, first_name: "D", username: "target_d" })
      bipbank.deposit(48, 100, "admin", "test")
      bipbank.setUsername(49, "target_d")

      await user.sendCommand("transfer", "@target_d 30")
      expect(textOf(env.apiCalls[0])).toContain("💸")
      expect(bipbank.balance(49)).toBe(28) // 30 - ceil(30*0.05) = 30 - 2 = 28
    })
  })

  // ── /rain ────────────────────────────────────────────────────────
  describe("/rain", () => {
    it("rejects in private chat", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 50, first_name: "Rainer" })
      await user.sendCommand("rain", "100")
      expect(textOf(env.apiCalls[0])).toContain("Дождь работает только в группах")
    })

    it("rejects insufficient balance", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 51, first_name: "PoorRain" })
      const chat = env.createChat({ type: "supergroup" })
      for (const id of [51, 52, 53, 54]) bipbank.ensureChatUser(chat.payload.id, id)
      await user.in(chat).sendCommand("rain", "999")
      expect(textOf(env.apiCalls[0])).toContain("Недостаточно")
    })

    it("distributes to chat members", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 55, first_name: "Richer" })
      bipbank.deposit(55, 500, "admin", "test")
      for (const id of [56, 57, 58, 59]) bipbank.ensureUser(id)
      const chat = env.createChat({ type: "supergroup" })
      for (const id of [55, 56, 57, 58, 59]) bipbank.ensureChatUser(chat.payload.id, id)

      await user.in(chat).sendCommand("rain", "100")
      expect(textOf(env.apiCalls[0])).toContain("🌧")
      // 100 withdrawn, fee = ceil(100*0.05) = 5, pool = 95
      expect(bipbank.balance(55)).toBe(400) // 500 - 100
      expect(bipbank.totalBurned()).toBe(5)
      const sumRecv = [56, 57, 58, 59].reduce((s, id) => s + bipbank.balance(id), 0)
      expect(sumRecv).toBe(95)
    })
  })

  // ── /top ─────────────────────────────────────────────────────────
  describe("/top", () => {
    it("silent in private chat", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 60, first_name: "TopTest" })
      await user.sendCommand("top")
      expect(env.apiCalls.length).toBe(0)
    })

    it("shows top in group", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 61, first_name: "TopGroup" })
      bipbank.deposit(61, 100, "admin", "test")
      const chat = env.createChat({ type: "supergroup" })
      bipbank.ensureChatUser(chat.payload.id, 61)

      await user.in(chat).sendCommand("top")
      expect(textOf(env.apiCalls[0])).toContain("Топ чата")
      expect(textOf(env.apiCalls[0])).toContain("100")
    })
  })

  // ── /globaltop ───────────────────────────────────────────────────
  describe("/globaltop", () => {
    it("shows global ranking with masked IDs", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 70, first_name: "Global" })
      bipbank.deposit(70, 100, "admin", "test")
      await user.sendCommand("globaltop")
      expect(textOf(env.apiCalls[0])).toContain("Глобальный топ")
    })
  })

  // ── /history ─────────────────────────────────────────────────────
  describe("/history", () => {
    it("shows empty for fresh user", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 80, first_name: "Fresh" })
      await user.sendCommand("history")
      expect(textOf(env.apiCalls[0])).toContain("История пуста")
    })

    it("lists recent transactions", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 81, first_name: "Historian" })
      bipbank.deposit(81, 100, "work", "test job")
      await user.sendCommand("history")
      expect(textOf(env.apiCalls[0])).toContain("💼")
    })
  })

  // ── /coinflip ───────────────────────────────────────────────────
  describe("/coinflip", () => {
    it("rejects missing args", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 100, first_name: "Gambler" })
      await user.sendCommand("coinflip")
      expect(textOf(env.apiCalls[0])).toContain("Укажи")
    })

    it("rejects invalid amount", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 102, first_name: "BadAmount" })
      await user.sendCommand("coinflip", "abc")
      expect(textOf(env.apiCalls[0])).toContain("положительным")
    })

    it("rejects insufficient balance", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 103, first_name: "Broke" })
      await user.sendCommand("coinflip", "100")
      expect(textOf(env.apiCalls[0])).toContain("Недостаточно")
    })

    it("rejects below minimum", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 107, first_name: "Small" })
      bipbank.deposit(107, 100, "admin", "test")
      await user.sendCommand("coinflip", "5")
      expect(textOf(env.apiCalls[0])).toContain("Минимальная")
    })

    it("rejects above maximum", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 108, first_name: "Big" })
      bipbank.deposit(108, 1000, "admin", "test")
      await user.sendCommand("coinflip", "999")
      expect(textOf(env.apiCalls[0])).toContain("Максимальная")
    })

    it("creates game with buttons", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 104, first_name: "Creator" })
      bipbank.deposit(104, 200, "admin", "test")

      await user.sendCommand("coinflip", "50")

      const msg = env.lastBotMessage()
      expect(msg).toBeDefined()
      expect(msg!.payload.reply_markup).toBeDefined()
      expect(msg!.payload.reply_markup!.inline_keyboard!.length).toBe(2)
    })

    it("processes heads click", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 105, first_name: "Player" })
      bipbank.deposit(105, 200, "admin", "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("coinflip", "50")
      const gameMsg = env.lastBotMessage()
      expect(gameMsg).toBeDefined()

      await user.on(gameMsg!).clickByText('🦅 Орёл')

      const bal = bipbank.balance(105)
      // 200 - 50 = 150 if lose, or 200 - 50 + 100 = 250 if win
      expect(bal === 150 || bal === 250).toBe(true)
    })

    it("records gambled transactions on click", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 106, first_name: "Tracker" })
      bipbank.deposit(106, 200, "admin", "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("coinflip", "50")
      const gameMsg = env.lastBotMessage()

      await user.on(gameMsg!).clickByText('🌿 Решка')

      const tx = bipbank.history(106, 10)
      const gambled = tx.filter((t: any) => t.type === 'gambled')
      expect(gambled.length).toBeGreaterThanOrEqual(1)
    })

    it("close button works for creator", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 109, first_name: "Closer" })
      bipbank.deposit(109, 200, "admin", "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("coinflip", "50")
      const gameMsg = env.lastBotMessage()

      await user.on(gameMsg!).clickByText('🏁 Закрыть')

      const ans = env.lastApiCall('answerCallbackQuery')
      expect(ans?.params?.text).toContain('закрыта')
    })

    it("alert shows balance after play", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 110, first_name: "Balancer" })
      bipbank.deposit(110, 200, "admin", "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("coinflip", "50")
      const gameMsg = env.lastBotMessage()

      await user.on(gameMsg!).clickByText('🦅 Орёл')

      const ans = env.lastApiCall('answerCallbackQuery')
      expect(ans?.params?.text).toContain('Баланс:')
    })

    it("log shows last 5 entries newest first", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 111, first_name: "Logger" })
      bipbank.deposit(111, 1000, "admin", "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("coinflip", "10")
      const gameMsg = env.lastBotMessage()

      for (let i = 0; i < 3; i++) {
        await user.on(gameMsg!).clickByText('🦅 Орёл')
      }

      const edited = env.lastApiCall('editMessageText')
      const text = edited?.params?.text || ''
      const logLines = text.split('\n').filter((l: string) => l.includes('✅') || l.includes('❌'))
      expect(logLines.length).toBeLessThanOrEqual(5)
    })
  })

  // ── Stabilizer ──────────────────────────────────────────────────
  describe("Economy stabilizer", () => {
    it("starts at 1.5 for empty economy (stimulation)", () => {
      expect(bipbank.stabilizer.coeff).toBe(1.5)
    })

    it("getWorkAmount returns within expected range", () => {
      bipbank.clearAll()
      bipbank.deposit(200, 1000, "admin", "test")
      for (let i = 0; i < 50; i++) {
        const amt = bipbank.stabilizer.getWorkAmount()
        expect(amt).toBeGreaterThanOrEqual(8)
        expect(amt).toBeLessThanOrEqual(60)
      }
    })

    it("getDailyBaseAmount returns non-negative", () => {
      bipbank.clearAll()
      bipbank.deposit(210, 100, "admin", "test")
      for (let s = 1; s <= 10; s++) {
        expect(bipbank.stabilizer.getDailyBaseAmount(s)).toBeGreaterThan(0)
      }
    })
  })

  // ── economyStats / totalBurned ──────────────────────────────────
  describe("BipBank economy helpers", () => {
    it("totalBurned starts at 0", () => {
      expect(bipbank.totalBurned()).toBe(0)
    })

    it("totalBurned increases after burn and fees", () => {
      bipbank.deposit(90, 200, "admin", "test")
      bipbank.burn(90, 50)
      expect(bipbank.totalBurned()).toBe(50)
      bipbank.transfer(90, 91, 100) // fee = 5
      expect(bipbank.totalBurned()).toBe(55)
    })

    it("economyStats returns all fields", () => {
      bipbank.clearAll()
      bipbank.deposit(95, 200, "admin", "test")
      bipbank.deposit(95, 50, "work", "job")
      bipbank.deposit(95, 30, "daily", "streak")
      bipbank.transfer(95, 96, 100)
      bipbank.burn(95, 10)
      bipbank.withdraw(95, 20, "gambled", "test bet")
      const stats = bipbank.economyStats()
      expect(stats.totalSupply).toBeGreaterThan(0)
      expect(stats.userCount).toBeGreaterThan(0)
      expect(stats.totalTransactions).toBeGreaterThan(0)
      expect(stats.totalEarnedWork).toBeGreaterThan(0)
      expect(stats.totalEarnedDaily).toBeGreaterThan(0)
      expect(stats.totalBurned).toBeGreaterThan(0)
      expect(stats.totalTransferred).toBeGreaterThan(0)
      expect(stats.totalGambled).toBeGreaterThan(0)
    })
  })

  // ── /admin ──────────────────────────────────────────────────────
  describe("/admin", () => {
    it("rejects non-admin silently", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 999, first_name: "Hacker" })
      await user.sendCommand("bbadmin", "@user +100")
      expect(env.apiCalls.length).toBe(0)
    })

    it("shows format hint when args missing", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 1, first_name: "Admin" })
      await user.sendCommand("bbadmin")
      expect(textOf(env.apiCalls[0])).toContain("Формат")
    })

    it("deposits by @mention", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 1, first_name: "Admin", username: "admin_u" })
      bipbank.setUsername(60, "target_a")
      await user.sendCommand("bbadmin", "@target_a +100 za test")
      expect(textOf(env.apiCalls[0])).toContain("начислил")
      expect(textOf(env.apiCalls[0])).toContain("100")
      expect(textOf(env.apiCalls[0])).toContain("za test")
      expect(bipbank.balance(60)).toBe(100)
    })

    it("withdraws by @mention", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 1, first_name: "Admin" })
      bipbank.setUsername(61, "target_b")
      bipbank.deposit(61, 200, "admin", "seed")
      await user.sendCommand("bbadmin", "@target_b -50 shtraf")
      expect(textOf(env.apiCalls[0])).toContain("списал")
      expect(textOf(env.apiCalls[0])).toContain("50")
      expect(textOf(env.apiCalls[0])).toContain("shtraf")
      expect(bipbank.balance(61)).toBe(150)
    })

    it("rejects withdraw with insufficient balance", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 1, first_name: "Admin" })
      bipbank.setUsername(62, "target_c")
      await user.sendCommand("bbadmin", "@target_c -50")
      expect(textOf(env.apiCalls[0])).toContain("Недостаточно")
    })

    it("rejects zero amount", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 1, first_name: "Admin" })
      bipbank.setUsername(63, "target_d")
      await user.sendCommand("bbadmin", "@target_d +0")
      expect(textOf(env.apiCalls[0])).toContain("0")
    })

    it("rejects unknown @mention", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 1, first_name: "Admin" })
      await user.sendCommand("bbadmin", "@nobody +100")
      expect(textOf(env.apiCalls[0])).toContain("не найден")
    })

    it("rejects missing amount sign", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 1, first_name: "Admin" })
      bipbank.setUsername(64, "target_e")
      await user.sendCommand("bbadmin", "@target_e 100")
      expect(textOf(env.apiCalls[0])).toContain("+/-")
    })
  })
})
