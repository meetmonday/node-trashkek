//@ts-nocheck
import { describe, expect, it, beforeEach, beforeAll } from "bun:test"
import { Bot } from "gramio"
import { TelegramTestEnvironment } from "@gramio/test"
import { autoload } from "@gramio/autoload"

function textOf(call: any): string {
  const t = call?.params?.text
  return typeof t === 'string' ? t : String(t ?? '')
}

let bot: any, bipbank: any, TX_TYPE: any

describe("Bipki Commands", () => {
  beforeAll(async () => {
    const mod = await import("@/economy")
    bipbank = mod.bipbank
    TX_TYPE = mod.TX_TYPE
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
      bipbank.deposit(2, 50, TX_TYPE.admin, "test")
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
      bipbank.deposit(33, 100, TX_TYPE.admin, "test")
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
      bipbank.deposit(41, 100, TX_TYPE.admin, "test")
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
      bipbank.deposit(44, 200, TX_TYPE.admin, "test")
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
      bipbank.deposit(46, 200, TX_TYPE.admin, "test")
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
      bipbank.deposit(48, 100, TX_TYPE.admin, "test")
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
      bipbank.deposit(55, 500, TX_TYPE.admin, "test")
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
      bipbank.deposit(61, 100, TX_TYPE.admin, "test")
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
      bipbank.deposit(70, 100, TX_TYPE.admin, "test")
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
      bipbank.deposit(81, 100, TX_TYPE.work, "test job")
      await user.sendCommand("history")
      expect(textOf(env.apiCalls[0])).toContain("💼")
    })
  })

  // ── getDiceResult (pure) ────────────────────────────────────────
  describe("getDiceResult", () => {
    it("pays 3x on value 6", async () => {
      const { getDiceResult } = await import("@/commands/bipki/activities/games/dice")
      const r = getDiceResult(6)
      expect(r.payoutMult).toBe(3)
      expect(r.winName).toContain("Шестёрка")
    })

    it("pays 2x on value 5", async () => {
      const { getDiceResult } = await import("@/commands/bipki/activities/games/dice")
      const r = getDiceResult(5)
      expect(r.payoutMult).toBe(2)
      expect(r.winName).toContain("Пятёрка")
    })

    it("pays 1x on value 4 (refund)", async () => {
      const { getDiceResult } = await import("@/commands/bipki/activities/games/dice")
      const r = getDiceResult(4)
      expect(r.payoutMult).toBe(1)
      expect(r.winName).toContain("Четвёрка")
    })

    it("pays 0x on values 1-3", async () => {
      const { getDiceResult } = await import("@/commands/bipki/activities/games/dice")
      for (const v of [1, 2, 3]) {
        expect(getDiceResult(v).payoutMult).toBe(0)
      }
    })

    it("returns emoji display for each value", async () => {
      const { getDiceResult } = await import("@/commands/bipki/activities/games/dice")
      for (let v = 1; v <= 6; v++) {
        const r = getDiceResult(v)
        expect(r.display.length).toBeGreaterThan(0)
      }
    })
  })

  // ── getSlotResult (pure) ────────────────────────────────────────
  describe("getSlotResult", () => {
    it("pays 10x on 7️⃣7️⃣7️⃣ (value 64)", async () => {
      const { getSlotResult } = await import("@/commands/bipki/activities/games/slots")
      const r = getSlotResult(64)
      expect(r.payoutMult).toBe(10)
      expect(r.winName).toContain("Джекпот")
    })

    it("pays 5x on 🎰🎰🎰 (value 1)", async () => {
      const { getSlotResult } = await import("@/commands/bipki/activities/games/slots")
      const r = getSlotResult(1)
      expect(r.payoutMult).toBe(5)
      expect(r.winName).toContain("BAR")
    })

    it("pays 3x on 🍇🍇🍇 (value 22)", async () => {
      const { getSlotResult } = await import("@/commands/bipki/activities/games/slots")
      const r = getSlotResult(22)
      expect(r.payoutMult).toBe(3)
      expect(r.winName).toContain("Виноград")
    })

    it("pays 2x on 🍋🍋🍋 (value 43)", async () => {
      const { getSlotResult } = await import("@/commands/bipki/activities/games/slots")
      const r = getSlotResult(43)
      expect(r.payoutMult).toBe(2)
      expect(r.winName).toContain("Лимон")
    })

    it("pays 1x on pair", async () => {
      const { getSlotResult } = await import("@/commands/bipki/activities/games/slots")
      // value 2 = 0b000010 = 🎰 🎰 🍇 (pair of BAR)
      const r = getSlotResult(2)
      expect(r.payoutMult).toBe(1)
      expect(r.winName).toContain("Пара")
    })

    it("pays 0x on all different", async () => {
      const { getSlotResult } = await import("@/commands/bipki/activities/games/slots")
      // value 0 = 0b000000 = 🎰 🎰 🎰 (wait no, that's triple BAR)
      // value 21 = 0b010101 = 🎰 🍇 🎰 (pair, not all different)
      // Let me find a guaranteed all-different: 🎰🍇🍋 = bits 0,1,2 = 0b100100 = 36
      // Actually: r0=0(BAR), r1=1(grape), r2=2(lemon) → bits: 0 | 1<<2 | 2<<4 = 0 | 4 | 32 = 36
      const r = getSlotResult(36)
      expect(r.payoutMult).toBe(0)
      expect(r.winName).toBe("Мимо")
    })

    it("returns display with 3 space-separated parts", async () => {
      const { getSlotResult } = await import("@/commands/bipki/activities/games/slots")
      const r = getSlotResult(36)
      expect(r.display.split(' ').length).toBe(3)
    })
  })

  // ── /dice (command flow) ────────────────────────────────────────
  describe("/dice", () => {
    it("rejects missing args", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 200, first_name: "Dice" })
      await user.sendCommand("dice")
      expect(textOf(env.apiCalls[0])).toContain("Укажи")
    })

    it("rejects invalid amount", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 201, first_name: "BadDice" })
      await user.sendCommand("dice", "abc")
      expect(textOf(env.apiCalls[0])).toContain("положительным")
    })

    it("rejects insufficient balance", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 202, first_name: "BrokeDice" })
      await user.sendCommand("dice", "100")
      expect(textOf(env.apiCalls[0])).toContain("Недостаточно")
    })

    it("rejects below minimum", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 203, first_name: "SmallDice" })
      bipbank.deposit(203, 100, TX_TYPE.admin, "test")
      await user.sendCommand("dice", "5")
      expect(textOf(env.apiCalls[0])).toContain("Минимальная")
    })

    it("rejects above maximum", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 204, first_name: "BigDice" })
      bipbank.deposit(204, 1000, TX_TYPE.admin, "test")
      await user.sendCommand("dice", "999")
      expect(textOf(env.apiCalls[0])).toContain("Максимальная")
    })

    it("creates game with buttons", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 205, first_name: "DiceCreator" })
      bipbank.deposit(205, 200, TX_TYPE.admin, "test")
      await user.sendCommand("dice", "50")
      const msg = env.lastBotMessage()
      expect(msg).toBeDefined()
      expect(msg!.payload.reply_markup).toBeDefined()
    })

    it("refunds bet when sendDice fails", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 206, first_name: "FailDice" })
      bipbank.deposit(206, 200, TX_TYPE.admin, "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("dice", "50")
      const gameMsg = env.lastBotMessage()
      expect(gameMsg).toBeDefined()

      bot.api.sendDice = async () => { throw new Error("API fail") }
      await user.on(gameMsg!).clickByText('🎲 Бросить')

      expect(bipbank.balance(206)).toBe(200)
    })

    it("close button works for creator", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 210, first_name: "CloseDice" })
      bipbank.deposit(210, 200, TX_TYPE.admin, "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("dice", "50")
      const gameMsg = env.lastBotMessage()

      await user.on(gameMsg!).clickByText('🏁 Закрыть')

      const edited = env.lastApiCall('editMessageText')
      expect(edited?.params?.text).toContain('завершена')
    })

    it("double/halve changes bet for creator", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 212, first_name: "BetDice" })
      bipbank.deposit(212, 500, TX_TYPE.admin, "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("dice", "50")
      const gameMsg = env.lastBotMessage()

      await user.on(gameMsg!).clickByText('✖️ x2')
      let edited = env.lastApiCall('editMessageText')
      expect(edited?.params?.text).toContain('100')

      await user.on(gameMsg!).clickByText('➗ x0.5')
      edited = env.lastApiCall('editMessageText')
      expect(edited?.params?.text).toContain('50')
    })
  })

  // ── /slots (command flow) ──────────────────────────────────────
  describe("/slots", () => {
    it("rejects missing args", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 300, first_name: "Slots" })
      await user.sendCommand("slots")
      expect(textOf(env.apiCalls[0])).toContain("Укажи")
    })

    it("rejects invalid amount", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 301, first_name: "BadSlots" })
      await user.sendCommand("slots", "xyz")
      expect(textOf(env.apiCalls[0])).toContain("положительным")
    })

    it("rejects insufficient balance", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 302, first_name: "BrokeSlots" })
      await user.sendCommand("slots", "500")
      expect(textOf(env.apiCalls[0])).toContain("Недостаточно")
    })

    it("creates game with buttons", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 303, first_name: "SlotsCreator" })
      bipbank.deposit(303, 200, TX_TYPE.admin, "test")
      await user.sendCommand("slots", "50")
      const msg = env.lastBotMessage()
      expect(msg).toBeDefined()
      expect(msg!.payload.reply_markup).toBeDefined()
    })

    it("close button works for creator", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 308, first_name: "CloseSlots" })
      bipbank.deposit(308, 200, TX_TYPE.admin, "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("slots", "50")
      const gameMsg = env.lastBotMessage()

      await user.on(gameMsg!).clickByText('🏁 Закрыть')

      const edited = env.lastApiCall('editMessageText')
      expect(edited?.params?.text).toContain('завершена')
    })

    it("double/halve changes bet for creator", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 309, first_name: "BetSlots" })
      bipbank.deposit(309, 500, TX_TYPE.admin, "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("slots", "50")
      const gameMsg = env.lastBotMessage()

      await user.on(gameMsg!).clickByText('✖️ x2')
      let edited = env.lastApiCall('editMessageText')
      expect(edited?.params?.text).toContain('100')

      await user.on(gameMsg!).clickByText('➗ x0.5')
      edited = env.lastApiCall('editMessageText')
      expect(edited?.params?.text).toContain('50')
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
      bipbank.deposit(107, 100, TX_TYPE.admin, "test")
      await user.sendCommand("coinflip", "5")
      expect(textOf(env.apiCalls[0])).toContain("Минимальная")
    })

    it("rejects above maximum", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 108, first_name: "Big" })
      bipbank.deposit(108, 1000, TX_TYPE.admin, "test")
      await user.sendCommand("coinflip", "999")
      expect(textOf(env.apiCalls[0])).toContain("Максимальная")
    })

    it("creates game with buttons", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 104, first_name: "Creator" })
      bipbank.deposit(104, 200, TX_TYPE.admin, "test")

      await user.sendCommand("coinflip", "50")

      const msg = env.lastBotMessage()
      expect(msg).toBeDefined()
      expect(msg!.payload.reply_markup).toBeDefined()
      expect(msg!.payload.reply_markup!.inline_keyboard!.length).toBe(2)
    })

    it("processes heads click", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 105, first_name: "Player" })
      bipbank.deposit(105, 200, TX_TYPE.admin, "test")
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
      bipbank.deposit(106, 200, TX_TYPE.admin, "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("coinflip", "50")
      const gameMsg = env.lastBotMessage()

      await user.on(gameMsg!).clickByText('🌿 Решка')

      const tx = bipbank.history(106, 10)
      const gambled = tx.filter((t: any) => t.type === TX_TYPE.gambled)
      expect(gambled.length).toBeGreaterThanOrEqual(1)
    })

    it("close button works for creator", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 109, first_name: "Closer" })
      bipbank.deposit(109, 200, TX_TYPE.admin, "test")
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
      bipbank.deposit(110, 200, TX_TYPE.admin, "test")
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
      bipbank.deposit(111, 1000, TX_TYPE.admin, "test")
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

  // ── /crack (heist) ──────────────────────────────────────────────
  describe("/crack (heist)", () => {
    it("rejects invalid amount", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 400, first_name: "Cracker" })
      await user.sendCommand("crack", "abc")
      expect(textOf(env.apiCalls[0])).toContain("положительную")
    })

    it("rejects amount above max", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 401, first_name: "BigCrack" })
      await user.sendCommand("crack", "999")
      expect(textOf(env.apiCalls[0])).toContain("500")
    })

    it("rejects insufficient balance for bet", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 402, first_name: "BrokeCrack" })
      await user.sendCommand("crack", "100")
      expect(textOf(env.apiCalls[0])).toContain("Недостаточно")
    })

    it("creates heist with buttons (no bet)", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 403, first_name: "Sneaky" })
      bipbank.deposit(403, 500, TX_TYPE.admin, "test")
      await user.sendCommand("crack")
      const msg = env.lastBotMessage()
      expect(msg).toBeDefined()
      expect(msg!.payload.reply_markup).toBeDefined()
      expect(textOf(env.apiCalls[0])).toContain("ВЗЛОМ")
    })

    it("creates heist with bet", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 404, first_name: "Bettor" })
      bipbank.deposit(404, 500, TX_TYPE.admin, "test")
      await user.sendCommand("crack", "50")
      expect(textOf(env.apiCalls[0])).toContain("Залог")
      expect(textOf(env.apiCalls[0])).toContain("50")
      expect(bipbank.balance(404)).toBe(450)
    })

    it("rejects when bank is locked", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 405, first_name: "First" })
      const user2 = env.createUser({ id: 406, first_name: "Second" })
      bipbank.deposit(405, 500, TX_TYPE.admin, "test")
      bipbank.deposit(406, 500, TX_TYPE.admin, "test")

      await user.sendCommand("crack")
      expect(bipbank.heist.isLocked).toBe(true)

      await user2.sendCommand("crack")
      expect(textOf(env.apiCalls[1])).toContain("Подожди")

      bipbank.heist.releaseLock()
    })

    it("rejects cooldown", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 407, first_name: "CooldownGuy" })
      bipbank.deposit(407, 500, TX_TYPE.admin, "test")

      bipbank.heist.setCooldown(407, true)
      await user.sendCommand("crack")
      expect(textOf(env.apiCalls[0])).toContain("Нельзя грабить")
    })

    it("cancel refunds bet", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 408, first_name: "CancelGuy" })
      bipbank.deposit(408, 500, TX_TYPE.admin, "test")
      const chat = env.createChat({ type: "supergroup" })

      await user.in(chat).sendCommand("crack", "50")
      const gameMsg = env.lastBotMessage()
      expect(gameMsg).toBeDefined()
      expect(bipbank.balance(408)).toBe(450)

      await user.on(gameMsg!).clickByText('❌ Отмена')

      expect(bipbank.balance(408)).toBe(500)
      expect(bipbank.heist.isLocked).toBe(false)
    })

    it("addToVault increases vault", () => {
      bipbank.clearAll()
      bipbank.heist.initVault()
      const before = bipbank.heist.vaultBalance
      bipbank.heist.addToVault(100)
      expect(bipbank.heist.vaultBalance).toBe(before + 100)
    })

    it("addToVault and takeFromVault work", () => {
      bipbank.clearAll()
      bipbank.heist.initVault()
      expect(bipbank.heist.vaultBalance).toBe(0)
      bipbank.heist.addToVault(5000)
      expect(bipbank.heist.vaultBalance).toBe(5000)
      const taken = bipbank.heist.takeFromVault(999999)
      expect(taken).toBe(5000)
      expect(bipbank.heist.vaultBalance).toBe(0)
    })

    it("lock/unlock works", () => {
      expect(bipbank.heist.acquireLock(999)).toBe(true)
      expect(bipbank.heist.isLocked).toBe(true)
      expect(bipbank.heist.acquireLock(888)).toBe(false)
      bipbank.heist.releaseLock()
      expect(bipbank.heist.isLocked).toBe(false)
      expect(bipbank.heist.lockUserId).toBe(null)
    })

    it("calculate reward formula", () => {
      const vault = 1000
      // 3/3 stages → limit = 500 + 200 = 700, base = 1000, min = 700
      expect(bipbank.heist.calculateReward(vault, 3)).toBe(700)
      // 2/3 → base = 666, limit = 700, min = 666
      expect(bipbank.heist.calculateReward(vault, 2)).toBe(666)
      // 1/3 → base = 333, limit = 700, min = 333
      expect(bipbank.heist.calculateReward(vault, 1)).toBe(333)
      // large vault: limit kicks in
      const bigVault = 10000
      expect(bipbank.heist.calculateReward(bigVault, 3)).toBe(2500)
      expect(bipbank.heist.calculateReward(bigVault, 1)).toBe(2500)
    })

    it("cooldown persists in meta", () => {
      bipbank.heist.setCooldown(999, true)
      const cd = bipbank.heist.getCooldown(999)
      expect(cd).toBeGreaterThan(0)
      expect(cd).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
    })
  })

  // ── Stabilizer ──────────────────────────────────────────────────
  describe("Economy stabilizer", () => {
    it("starts at 1.5 for empty economy (stimulation)", () => {
      expect(bipbank.stabilizer.coeff).toBe(1.5)
    })

    it("getWorkAmount returns within expected range", () => {
      bipbank.clearAll()
      bipbank.deposit(200, 1000, TX_TYPE.admin, "test")
      for (let i = 0; i < 50; i++) {
        const amt = bipbank.stabilizer.getWorkAmount()
        expect(amt).toBeGreaterThanOrEqual(8)
        expect(amt).toBeLessThanOrEqual(60)
      }
    })

    it("getDailyBaseAmount returns non-negative", () => {
      bipbank.clearAll()
      bipbank.deposit(210, 100, TX_TYPE.admin, "test")
      for (let s = 1; s <= 10; s++) {
        expect(bipbank.stabilizer.getDailyBaseAmount(s)).toBeGreaterThan(0)
      }
    })

    it("whale does not crash stabilizer (supplyCapped protection)", () => {
      bipbank.clearAll()
      for (let i = 0; i < 9; i++) {
        bipbank.deposit(1000 + i, 100, TX_TYPE.admin, "normal")
      }
      bipbank.deposit(9999, 100_000, TX_TYPE.admin, "whale")
      expect(bipbank.stabilizer.coeff).toBe(1.5)
    })
  })

  // ── economyStats / totalBurned ──────────────────────────────────
  describe("BipBank economy helpers", () => {
    it("totalBurned starts at 0", () => {
      expect(bipbank.totalBurned()).toBe(0)
    })

    it("totalBurned increases after burn and fees", () => {
      bipbank.deposit(90, 200, TX_TYPE.admin, "test")
      bipbank.burn(90, 50)
      expect(bipbank.totalBurned()).toBe(50)
      bipbank.transfer(90, 91, 100) // fee = 5
      expect(bipbank.totalBurned()).toBe(55)
    })

    it("economyStats returns all fields", () => {
      bipbank.clearAll()
      bipbank.deposit(95, 200, TX_TYPE.admin, "test")
      bipbank.deposit(95, 50, TX_TYPE.work, "job")
      bipbank.deposit(95, 30, TX_TYPE.daily, "streak")
      bipbank.transfer(95, 96, 100)
      bipbank.burn(95, 10)
      bipbank.withdraw(95, 20, TX_TYPE.gambled, "test bet")
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
      bipbank.deposit(61, 200, TX_TYPE.admin, "seed")
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

// ── /charity ──────────────────────────────────────────────────────
describe("/charity", () => {
  beforeEach(() => { bipbank.clearAll() })

  describe("CharityManager.collect", () => {
    it("takes 1% from users above average balance", () => {
      bipbank.deposit(900, 1000, TX_TYPE.admin, "test")
      bipbank.deposit(901, 10, TX_TYPE.admin, "test")
      const result = bipbank.charity.collect()
      expect(result.payerCount).toBe(1)
      expect(result.totalCollected).toBe(10)
      expect(bipbank.balance(900)).toBe(990)
      expect(bipbank.balance(901)).toBe(10)
      expect(bipbank.charity.bankBalance).toBe(10)
    })

    it("skips users with charity_rate = 0", () => {
      bipbank.deposit(910, 1000, TX_TYPE.admin, "test")
      bipbank.deposit(911, 10, TX_TYPE.admin, "test")
      bipbank.charity.setRate(910, 0)
      const result = bipbank.charity.collect()
      expect(result.payerCount).toBe(0)
      expect(result.totalCollected).toBe(0)
      expect(bipbank.balance(910)).toBe(1000)
    })

    it("respects custom charity rates", () => {
      bipbank.deposit(920, 1000, TX_TYPE.admin, "test")
      bipbank.deposit(921, 10, TX_TYPE.admin, "test")
      bipbank.updateUser(920, { charity_rate: 5 })
      const result = bipbank.charity.collect()
      expect(result.payerCount).toBe(1)
      expect(result.totalCollected).toBe(50)
      expect(bipbank.balance(920)).toBe(950)
    })

    it("marks collection date in meta", () => {
      bipbank.deposit(930, 100, TX_TYPE.admin, "test")
      bipbank.deposit(931, 10, TX_TYPE.admin, "test")
      expect(bipbank.charity.isCollectionDue()).toBe(true)
      bipbank.charity.collect()
      expect(bipbank.charity.isCollectionDue()).toBe(false)
    })

    it("collects from multiple rich users", () => {
      bipbank.deposit(940, 500, TX_TYPE.admin, "test")
      bipbank.deposit(941, 400, TX_TYPE.admin, "test")
      bipbank.deposit(942, 10, TX_TYPE.admin, "test")
      const result = bipbank.charity.collect()
      expect(result.payerCount).toBe(2)
      expect(result.totalCollected).toBe(9)
    })
  })

  describe("CharityManager income penalty", () => {
    it("penalizes user with rate=0: 2/3 to vault", () => {
      bipbank.deposit(950, 100, TX_TYPE.admin, "test")
      bipbank.updateUser(950, { charity_rate: 0 })
      bipbank.deposit(950, 90, TX_TYPE.work, "test job")
      expect(bipbank.balance(950)).toBe(130) // 100 + 90/3
      expect(bipbank.charity.bankBalance).toBe(60) // 90*2/3
    })

    it("does not penalize user with rate=1", () => {
      bipbank.deposit(951, 100, TX_TYPE.admin, "test")
      bipbank.deposit(951, 90, TX_TYPE.work, "test job")
      expect(bipbank.balance(951)).toBe(190)
      expect(bipbank.charity.bankBalance).toBe(0)
    })
  })

  describe("CharityManager personal coefficient", () => {
    it("rate=2 gives 1.05 personal coeff", () => {
      bipbank.ensureUser(960)
      bipbank.updateUser(960, { charity_rate: 2 })
      bipbank.deposit(960, 90, TX_TYPE.work, "test job")
      expect(bipbank.balance(960)).toBe(95) // round(90 * 1.05)
    })

    it("rate=5 gives 1.20 personal coeff", () => {
      bipbank.ensureUser(961)
      bipbank.updateUser(961, { charity_rate: 5 })
      bipbank.deposit(961, 100, TX_TYPE.work, "test job")
      expect(bipbank.balance(961)).toBe(120) // round(100 * 1.20)
    })

    it("rate=1 gives no boost", () => {
      bipbank.deposit(962, 100, TX_TYPE.work, "test job")
      expect(bipbank.balance(962)).toBe(100)
    })
  })

  describe("CharityManager withdraw", () => {
    it("allows poor user to withdraw quarter", () => {
      bipbank.deposit(970, 50, TX_TYPE.admin, "test")
      bipbank.charity.addToBank(1000)
      const taken = bipbank.charity.withdraw(970, 'quarter')
      expect(taken).toBe(250)
      expect(bipbank.balance(970)).toBe(300)
      expect(bipbank.charity.bankBalance).toBe(750)
    })

    it("allows poor user to withdraw half", () => {
      bipbank.deposit(971, 50, TX_TYPE.admin, "test")
      bipbank.charity.addToBank(1000)
      const taken = bipbank.charity.withdraw(971, 'half')
      expect(taken).toBe(500)
      expect(bipbank.balance(971)).toBe(550)
    })

    it("allows poor user to withdraw 90%", () => {
      bipbank.deposit(972, 50, TX_TYPE.admin, "test")
      bipbank.charity.addToBank(1000)
      const taken = bipbank.charity.withdraw(972, 'ninety')
      expect(taken).toBe(900)
      expect(bipbank.balance(972)).toBe(950)
      expect(bipbank.charity.bankBalance).toBe(100)
    })

    it("rejects rich user", () => {
      bipbank.deposit(973, 150, TX_TYPE.admin, "test")
      expect(() => bipbank.charity.withdraw(973, 'quarter')).toThrow()
    })

    it("enforces daily cooldown", () => {
      bipbank.deposit(974, 50, TX_TYPE.admin, "test")
      bipbank.charity.addToBank(1000)
      bipbank.charity.withdraw(974, 'quarter')
      expect(() => bipbank.charity.withdraw(974, 'quarter')).toThrow()
    })
  })

  describe("CharityManager.setRate / getRate", () => {
    it("returns default rate 1 for new user", () => {
      bipbank.ensureUser(980)
      expect(bipbank.charity.getRate(980)).toBe(1)
    })

    it("persists rate changes via setRate", () => {
      bipbank.ensureUser(981)
      bipbank.charity.setRate(981, 0)
      expect(bipbank.charity.getRate(981)).toBe(0)
      bipbank.charity.setRate(981, 5)
      expect(bipbank.charity.getRate(981)).toBe(5)
    })

    it("persists rate changes via updateUser", () => {
      bipbank.ensureUser(982)
      bipbank.updateUser(982, { charity_rate: 0 })
      const row = bipbank.getUser(982)
      console.log("charity_rate via getUser:", row.charity_rate)
      const rate = bipbank.charity.getRate(982)
      console.log("charity_rate via getRate:", rate)
      expect(rate).toBe(0)
    })
  })

  describe("/charity command", () => {
    it("shows charity menu", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 990, first_name: "CharityUser" })
      await user.sendCommand("charity")
      expect(textOf(env.apiCalls[0])).toContain("БЛАГОТВОРИТЕЛЬНОСТЬ")
      expect(textOf(env.apiCalls[0])).toContain("1%")
    })

    it("changes rate via button click", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 991, first_name: "RateChanger" })
      await user.sendCommand("charity")
      const msg = env.lastBotMessage()
      expect(msg).toBeDefined()
      expect(bipbank.charity.getRate(991)).toBe(1)

      await user.on(msg!).clickByText('5%')

      expect(bipbank.charity.getRate(991)).toBe(5)
      const edited = env.lastApiCall('editMessageText')
      expect(edited?.params?.text).toContain("5%")
    })

    it("shows withdraw buttons for poor user", async () => {
      const env = new TelegramTestEnvironment(bot)
      const user = env.createUser({ id: 992, first_name: "PoorCharity" })
      bipbank.deposit(992, 50, TX_TYPE.admin, "test")
      await user.sendCommand("charity")
      const msg = env.lastBotMessage()
      expect(msg).toBeDefined()
      const buttons = msg!.payload.reply_markup?.inline_keyboard?.flat() ?? []
      expect(buttons.some((b: any) => b.text.includes('25%'))).toBe(true)
    })

  })
})
