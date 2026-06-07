import { Database } from "bun:sqlite"
import { createGardenDbApi, type GardenDbApi } from "./queries"
import { initGardenSchema } from "./schema"
import type {
  PlantRow, SubspeciesRow, PlotRow, InventoryRow,
  TradeRow, Balance, ShopItem, Result,
} from "./types"

const SHARD_RARITY_QTY: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
}

const SHARDS_PER_CRAFT = 5

const AUTO_SELL_BASE = 50
const AUTO_SELL_MULT = 1.01

export class GardenManager {
  private db: GardenDbApi
  private rawDb: Database

  constructor(private getBipBank: () => {
    balance: (userId: number) => number
    getMegabipki: (userId: number) => number
    withdraw: (userId: number, amount: number, type: number, description: string) => boolean
    spendMegabipki: (userId: number, amount: number) => boolean
    awardMegabipki: (userId: number, amount: number) => void
    deposit: (to: number, amount: number, type: number, description?: string) => number
    transfer: (from: number, to: number, amount: number, description: string) => void
    ensureUser: (userId: number) => void
  }) {
    this.rawDb = new Database(this.getDbPath())
    this.rawDb.run("PRAGMA journal_mode=WAL")
    this.rawDb.run("PRAGMA busy_timeout=5000")
    this.rawDb.run("PRAGMA foreign_keys=ON")
    initGardenSchema(this.rawDb)
    this.db = createGardenDbApi(this.rawDb)
  }

  private getDbPath(): string {
    return process.env.BIPKI_DB_PATH || "data/bipki.db"
  }

  getBalance(userId: number): Balance {
    const bank = this.getBipBank()
    return {
      bipki: bank.balance(userId),
      megabipki: bank.getMegabipki(userId),
    }
  }

  getPlots(userId: number): PlotRow[] {
    return this.db.plots.all(userId)
  }

  getCatalog(): ShopItem[] {
    const plants = this.db.catalog.all()
    return plants.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      seed_price: p.seed_price,
      growth_sec: p.growth_sec,
      max_level: p.max_level,
      created_at: p.created_at,
      subspecies_count: p.subspecies_count,
    }))
  }

  private getAutoSellPrice(plantId: number, subspeciesId: number | null): number | null {
    if (plantId !== 1) return null
    let priceMult = 1.0
    if (subspeciesId !== null) {
      const ss = this.db.subspecies.byId(subspeciesId)
      if (ss) priceMult = ss.price_mult
    }
    return Math.round(AUTO_SELL_BASE * priceMult * AUTO_SELL_MULT)
  }

  private getSubspeciesOrBase(plantId: number, subspeciesId: number | null): SubspeciesRow | undefined {
    if (subspeciesId) {
      const ss = this.db.subspecies.byId(subspeciesId)
      if (ss) return ss
    }
    return this.db.subspecies.baseForPlant(plantId)
  }

  plantSeed(userId: number, idx: number, itemId: number): Result<{ germinated: boolean }> {
    const plots = this.db.plots.all(userId)
    const plot = plots.find((p) => p.idx === idx)
    if (!plot || plot.state !== "empty") {
      return { ok: false, error: "Грядка недоступна" }
    }

    const owned = this.db.plotsOwned.get(userId)
    if (!owned) {
      return { ok: false, error: "Ошибка данных" }
    }
    if (idx >= owned.plots_max) {
      return { ok: false, error: "Грядка не куплена" }
    }

    const inv = this.db.inventory.all(userId)
    const seed = inv.find((i) => i.id === itemId && i.type === "seed")
    if (!seed || seed.quantity < 1) {
      return { ok: false, error: "Семена не найдены" }
    }

    const subspecies = this.getSubspeciesOrBase(seed.plant_id!, seed.subspecies_id)
    if (!subspecies) {
      return { ok: false, error: "Подвид не найден" }
    }

    const germChance = subspecies.germination_chance
    const germRoll = Math.random() < germChance

    this.db.transaction(() => {
      this.db.inventory.subtract(this.rawDb, itemId)

      if (germRoll) {
        this.db.plots.updateState(
          this.rawDb, userId, idx, "growing",
          seed.plant_id, subspecies.id,
        )
      } else {
        this.db.plots.updateState(this.rawDb, userId, idx, "withered")
        const shardQty = SHARD_RARITY_QTY[subspecies.rarity] ?? 1
        this.db.inventory.getOrCreateShardRow(this.rawDb, userId, shardQty)
      }
    })

    if (germRoll) {
      return { ok: true, data: { germinated: true } }
    }
    return { ok: true, data: { germinated: false } }
  }

  harvestPlot(userId: number, idx: number): Result {
    const plots = this.db.plots.all(userId)
    const plot = plots.find((p) => p.idx === idx)
    if (!plot || !plot.plant_id || !plot.planted_at || !plot.growth_sec) {
      return { ok: false, error: "Нечего собирать" }
    }

    const planted = new Date(plot.planted_at + "Z").getTime()
    const elapsed = (Date.now() - planted) / 1000
    if (elapsed < plot.growth_sec) {
      return { ok: false, error: "Ещё не выросло" }
    }

    this.db.transaction(() => {
      this.db.plots.updateState(this.rawDb, userId, idx, "empty")
      this.db.inventory.add(this.rawDb, userId, "harvest", plot.plant_id!, 1, null, plot.subspecies_id)
    })

    return { ok: true, data: undefined }
  }

  autoSellHarvest(userId: number, idx: number): Result<{ price: number }> {
    const plots = this.db.plots.all(userId)
    const plot = plots.find((p) => p.idx === idx)
    if (!plot || !plot.plant_id || !plot.planted_at || !plot.growth_sec) {
      return { ok: false, error: "Нечего собирать" }
    }

    const planted = new Date(plot.planted_at + "Z").getTime()
    const elapsed = (Date.now() - planted) / 1000
    if (elapsed < plot.growth_sec) {
      return { ok: false, error: "Ещё не выросло" }
    }

    const price = this.getAutoSellPrice(plot.plant_id, plot.subspecies_id)
    if (price === null) {
      return { ok: false, error: "Автопродажа доступна только для подсолнухов" }
    }

    const bank = this.getBipBank()
    bank.deposit(userId, price, 11, `garden: auto-sell #${plot.plant_id}`)

    this.db.plots.updateState(this.rawDb, userId, idx, "empty")
    return { ok: true, data: { price } }
  }

  clearPlot(userId: number, idx: number): Result {
    this.db.plots.updateState(this.rawDb, userId, idx, "empty")
    return { ok: true, data: undefined }
  }

  buySeed(userId: number, plantId: number, quantity: number): Result {
    const plant = this.db.catalog.byId(plantId)
    if (!plant) {
      return { ok: false, error: "Растение не найдено" }
    }

    const qty = Math.min(Math.max(1, quantity), 100)
    const totalCost = plant.seed_price * qty
    const bank = this.getBipBank()

    if (!bank.withdraw(userId, totalCost, 10, `garden: seed #${plantId}`)) {
      return { ok: false, error: "Недостаточно бипок" }
    }

    this.db.inventory.add(this.rawDb, userId, "seed", plantId, qty)
    return { ok: true, data: undefined }
  }

  getInventory(userId: number): InventoryRow[] {
    return this.db.inventory.all(userId).filter((i) => i.quantity > 0)
  }

  getShardQuantity(userId: number): number {
    return this.db.inventory.shardQuantity(userId)
  }

  craftShards(userId: number, targetPlantId: number): Result<{ plant_id: number }> {
    const shardQty = this.db.inventory.shardQuantity(userId)
    if (shardQty < SHARDS_PER_CRAFT) {
      return { ok: false, error: `Нужно 5 обломков, у вас ${shardQty}` }
    }

    const plant = this.db.catalog.byId(targetPlantId)
    if (!plant) {
      return { ok: false, error: "Растение не найдено" }
    }

    this.db.transaction(() => {
      this.db.inventory.getOrCreateShardRow(this.rawDb, userId, -SHARDS_PER_CRAFT)
      this.db.inventory.add(this.rawDb, userId, "seed", targetPlantId, 1)
    })

    return { ok: true, data: { plant_id: targetPlantId } }
  }

  autoSellItem(userId: number, itemId: number): Result<{ price: number }> {
    const item = this.db.inventory.byId(itemId)
    if (!item || item.user_id !== userId) {
      return { ok: false, error: "Предмет не найден" }
    }
    if (item.type !== "harvest") {
      return { ok: false, error: "Можно продавать только урожай" }
    }
    if (!item.plant_id) {
      return { ok: false, error: "Неизвестное растение" }
    }
    if (this.db.trades.byItemId(itemId)) {
      return { ok: false, error: "Предмет уже выставлен на продажу" }
    }

    const price = this.getAutoSellPrice(item.plant_id, item.subspecies_id)
    if (price === null) {
      return { ok: false, error: "Автопродажа доступна только для подсолнухов" }
    }

    const bank = this.getBipBank()
    bank.deposit(userId, price, 11, `garden: auto-sell #${item.plant_id}`)
    this.db.inventory.subtract(this.rawDb, itemId)
    return { ok: true, data: { price } }
  }

  upgradeItem(userId: number, itemId: number): Result<{ level: number; discovered?: boolean; subspecies_name?: string }> {
    const item = this.db.inventory.byId(itemId)
    if (!item || item.user_id !== userId) {
      return { ok: false, error: "Предмет не найден" }
    }

    if (!item.plant_id) {
      return { ok: false, error: "Неизвестное растение" }
    }
    const plantId: number = item.plant_id

    const meta = item.meta ? JSON.parse(item.meta) : { level: 0 }
    const currentLevel: number = meta.level ?? 0

    const allSubspecies = this.db.subspecies.byPlant(plantId)
    const totalCount = allSubspecies.length
    const discoveredCount = this.db.discoveries.count(userId, plantId)

    if (discoveredCount >= totalCount) {
      return { ok: false, error: "Все подвиды этого растения уже открыты" }
    }

    const upgradeCost = 100 * (currentLevel + 1)
    const bank = this.getBipBank()

    if (bank.getMegabipki(userId) < upgradeCost) {
      return { ok: false, error: "Недостаточно мегабипок" }
    }

    let discovered = false
    let newSubspecies: SubspeciesRow | undefined

    this.db.transaction(() => {
      this.rawDb.run(
        "UPDATE users SET megabipki = megabipki - ? WHERE user_id = ?",
        [upgradeCost, userId],
      )

      const newLevel = currentLevel + 1
      meta.level = newLevel
      this.db.inventory.updateMeta(this.rawDb, itemId, JSON.stringify(meta))

      const chance = 0.25 - (discoveredCount / totalCount) * 0.15
      if (Math.random() < chance) {
        const undiscovered = this.db.discoveries.undiscovered(userId, plantId)
        if (undiscovered.length > 0) {
          const totalWeight = undiscovered.reduce((sum, s) => sum + s.discover_weight, 0)
          let roll = Math.random() * totalWeight
          for (const ss of undiscovered) {
            roll -= ss.discover_weight
            if (roll <= 0) {
              this.db.discoveries.create(this.rawDb, userId, ss.id)
              this.db.inventory.add(this.rawDb, userId, "seed", plantId, 1, null, ss.id)
              newSubspecies = ss
              discovered = true
              break
            }
          }
        }
      }
    })

    return {
      ok: true,
      data: {
        level: currentLevel + 1,
        discovered,
        subspecies_name: newSubspecies?.name,
      },
    }
  }

  getMarketTrades(userId: number): TradeRow[] {
    const trades = this.db.trades.all()
    for (const t of trades) {
      t.is_own = t.seller_id === userId
    }
    return trades
  }

  sellOnMarket(userId: number, itemId: number, price: number): Result {
    const existing = this.db.trades.byItemId(itemId)
    if (existing) {
      return { ok: false, error: "Уже продаётся" }
    }

    if (price < 10) {
      return { ok: false, error: "Минимальная цена: 10🪙" }
    }

    const item = this.db.inventory.byId(itemId)
    if (!item || !item.tradeable) {
      return { ok: false, error: "Нельзя продать этот предмет" }
    }

    this.db.transaction(() => {
      this.db.inventory.setTradeable(this.rawDb, itemId, 0)
      this.db.trades.create(this.rawDb, userId, itemId, price)
    })

    return { ok: true, data: undefined }
  }

  buyFromMarket(userId: number, tradeId: number): Result {
    const trade = this.db.trades.byId(tradeId)
    if (!trade) {
      return { ok: false, error: "Объявление не найдено" }
    }

    if (trade.seller_id === userId) {
      return { ok: false, error: "Нельзя купить свой лот" }
    }

    const bank = this.getBipBank()
    const fee = Math.ceil(trade.price * 0.05)
    const sellerPayout = trade.price - fee

    this.db.transaction(() => {
      const statusCheck = this.rawDb.query(
        "SELECT status FROM garden_trades WHERE id = ?",
      ).get(tradeId) as { status: string } | undefined

      if (!statusCheck || statusCheck.status !== "active") {
        throw new Error("Лот уже куплен")
      }

      if (!bank.withdraw(userId, trade.price, 2, `garden: buy item #${trade.item_id}`)) {
        throw new Error("Недостаточно бипок")
      }

      bank.deposit(trade.seller_id, sellerPayout, 2, `garden: sell item #${trade.item_id}`)
      bank.deposit(0, fee, 7, `garden: market fee #${trade.item_id}`)

      this.db.inventory.transfer(this.rawDb, trade.item_id, userId)
      this.db.trades.markSold(this.rawDb, tradeId)
    })

    return { ok: true, data: undefined }
  }

  cancelTrade(userId: number, tradeId: number): Result {
    const trade = this.db.trades.byId(tradeId)
    if (!trade || trade.seller_id !== userId) {
      return { ok: false, error: "Объявление не найдено" }
    }

    this.db.transaction(() => {
      this.db.inventory.setTradeable(this.rawDb, trade.item_id, 1)
      this.db.trades.markCancelled(this.rawDb, tradeId)
    })

    return { ok: true, data: undefined }
  }

  buyPlot(userId: number): Result<{ plots_max: number }> {
    const owned = this.db.plotsOwned.get(userId)
    if (!owned) {
      return { ok: false, error: "Ошибка данных" }
    }

    if (owned.plots_max >= 9) {
      return { ok: false, error: "Уже есть все 9 грядок" }
    }

    const nextPlotIdx = owned.plots_max
    const cost = 10 * Math.pow(2, nextPlotIdx - 1)
    const bank = this.getBipBank()

    if (bank.getMegabipki(userId) < cost) {
      return { ok: false, error: `Недостаточно мегабипок. Нужно: ${cost}💎` }
    }

    this.db.transaction(() => {
      if (!bank.spendMegabipki(userId, cost)) {
        throw new Error("Недостаточно мегабипок")
      }
      this.db.plotsOwned.increment(this.rawDb, userId)
    })

    return { ok: true, data: { plots_max: owned.plots_max + 1 } }
  }

  getDiscoveries(userId: number) {
    return this.db.discoveries.all(userId)
  }
}
