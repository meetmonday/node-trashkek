import { signal } from "@preact/signals"
import { api } from "./api"
import type { PlotRow, CatalogItem, InventoryItem, TradeItem, Balance } from "./types"

export const userBalance = signal<Balance>({ bipki: 0, megabipki: 0 })
export const plots = signal<PlotRow[]>([])
export const catalog = signal<CatalogItem[]>([])
export const inventory = signal<InventoryItem[]>([])
export const trades = signal<TradeItem[]>([])
export const shardQuantity = signal(0)
export const activeView = signal("garden")
export const toastMessage = signal<{ text: string; type: string } | null>(null)
export const modalVisible = signal(false)
export const modalContent = signal<unknown>(null)
export const plotInfoPlot = signal<PlotRow | null>(null)
export const timerTick = signal(Date.now())

let toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(text: string, type = ""): void {
  toastMessage.value = { text, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = null }, 2000)
}

export function showModal(content: unknown): void {
  modalContent.value = content
  plotInfoPlot.value = null
  modalVisible.value = true
}

export function hideModal(): void {
  modalVisible.value = false
  plotInfoPlot.value = null
}

function formatTime(sec: number): string {
  if (sec >= 60) {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${String(s).padStart(2, "0")}`
  }
  return `${Math.floor(sec)}с`
}

export function getPlotProgress(plot: PlotRow): number {
  if (!plot.planted_at || !plot.growth_sec) return 0
  const planted = new Date(plot.planted_at + "Z").getTime()
  const elapsed = (timerTick.value - planted) / 1000
  return Math.min(100, Math.max(0, (elapsed / plot.growth_sec) * 100))
}

export function getTimerDisplay(plot: PlotRow): string {
  if (plot.state === "withered") {
    if (!plot.withered_at) return "🥀"
    const withered = new Date(plot.withered_at + "Z").getTime()
    const elapsed = (timerTick.value - withered) / 1000
    const remaining = Math.max(0, 15 - elapsed)
    if (remaining <= 0) return "..."
    return `${Math.ceil(remaining)}с`
  }
  if (!plot.planted_at || !plot.growth_sec) return "..."
  const planted = new Date(plot.planted_at + "Z").getTime()
  const elapsed = (timerTick.value - planted) / 1000
  const remaining = Math.max(0, plot.growth_sec - elapsed)
  if (remaining <= 0) return "✨ Готово!"
  return formatTime(remaining)
}

export function isPlotReady(plot: PlotRow): boolean {
  if (!plot.planted_at || !plot.growth_sec) return false
  const planted = new Date(plot.planted_at + "Z").getTime()
  return (timerTick.value - planted) / 1000 >= plot.growth_sec
}

export function getStageEmoji(plot: PlotRow): string {
  if (plot.subspecies_emoji) return plot.subspecies_emoji
  if (plot.state === "ready") return "🌻"
  return "🌱"
}

export function getItemEmoji(item: InventoryItem): string {
  if (item.type === "seed") return item.subspecies_emoji || "🌱"
  if (item.type === "harvest") return item.subspecies_emoji || "🎁"
  if (item.type === "shard") return "🪨"
  return "📦"
}

export async function loadAll(): Promise<void> {
  const [balanceRes, plotsRes, shopRes, invRes, marketRes, shardRes] = await Promise.all([
    api("GET", "/user/balance"),
    api("GET", "/garden/plots"),
    api("GET", "/garden/shop"),
    api("GET", "/garden/inventory"),
    api("GET", "/garden/market"),
    api("GET", "/garden/shard-quantity"),
  ])

  if (balanceRes.ok) {
    userBalance.value = { bipki: balanceRes.bipki as number, megabipki: balanceRes.megabipki as number }
  }
  if (plotsRes.ok) {
    plots.value = plotsRes.plots as PlotRow[]
  }
  if (shopRes.ok) {
    catalog.value = shopRes.catalog as CatalogItem[]
    if (shopRes.balance) {
      const b = shopRes.balance as Record<string, unknown>
      userBalance.value = { bipki: b.bipki as number, megabipki: b.megabipki as number }
    }
  }
  if (invRes.ok) {
    inventory.value = invRes.items as InventoryItem[]
  }
  if (marketRes.ok) {
    trades.value = marketRes.trades as TradeItem[]
  }
  if (shardRes.ok) {
    shardQuantity.value = shardRes.quantity as number
  }
}

export async function loadInventoryAndPlots(): Promise<void> {
  const [plotsRes, invRes] = await Promise.all([
    api("GET", "/garden/plots"),
    api("GET", "/garden/inventory"),
  ])
  if (plotsRes.ok) plots.value = plotsRes.plots as PlotRow[]
  if (invRes.ok) inventory.value = invRes.items as InventoryItem[]
}

export async function loadBalance(): Promise<void> {
  const res = await api("GET", "/user/balance")
  if (res.ok) {
    userBalance.value = { bipki: res.bipki as number, megabipki: res.megabipki as number }
  }
}

export async function loadShard(): Promise<void> {
  const res = await api("GET", "/garden/shard-quantity")
  if (res.ok) shardQuantity.value = res.quantity as number
}

export async function plantSeed(idx: number, itemId: number): Promise<void> {
  hideModal()
  const prevPlots = plots.value
  const prevInv = inventory.value

  const seed = inventory.value.find((i) => i.id === itemId)
  const plantInfo = catalog.value.find((c) => c.id === seed?.plant_id)
  if (plantInfo) {
    plots.value = plots.value.map((p) =>
      p.idx === idx
        ? {
            ...p,
            state: "growing",
            plant_id: plantInfo.id,
            subspecies_id: seed?.subspecies_id ?? null,
            subspecies_name: seed?.subspecies_name,
            subspecies_emoji: seed?.subspecies_emoji,
            plant_name: plantInfo.name,
            growth_sec: plantInfo.growth_sec,
            rarity: seed?.rarity,
            planted_at: new Date().toISOString().slice(0, 19).replace("T", " "),
            stage: 1,
            withered_at: null,
          }
        : p,
    )
  }
  inventory.value = inventory.value
    .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
    .filter((i) => i.quantity > 0)

  const res = await api("POST", "/garden/plant", { idx, item_id: itemId })
  if (res.ok) {
    plots.value = res.plots as PlotRow[]
    inventory.value = res.inventory as InventoryItem[]
    const germinated = res.germinated as boolean
    if (germinated) {
      showToast("🌱 Посажено!", "success")
    } else {
      showToast("🥀 Семя не взошло!", "error")
      await loadShard()
    }
  } else {
    plots.value = prevPlots
    inventory.value = prevInv
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function onHarvest(idx: number): Promise<void> {
  hideModal()
  const prevPlots = plots.value
  const prevInv = inventory.value

  plots.value = plots.value.map((p) =>
    p.idx === idx
      ? { ...p, state: "empty", plant_id: null, planted_at: null, stage: 0, plant_name: undefined, growth_sec: undefined }
      : p,
  )

  const res = await api("POST", "/garden/harvest", { idx })
  if (res.ok) {
    plots.value = res.plots as PlotRow[]
    inventory.value = res.inventory as InventoryItem[]
    showToast("🎉 Собрано!", "success")
  } else {
    plots.value = prevPlots
    inventory.value = prevInv
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function buyPlant(plantId: number): Promise<void> {
  const prevBalance = userBalance.value
  const prevInv = inventory.value

  const plant = catalog.value.find((c) => c.id === plantId)
  if (plant) {
    userBalance.value = { ...userBalance.value, bipki: userBalance.value.bipki - plant.seed_price }
  }

  const res = await api("POST", "/garden/buy", { plant_id: plantId, quantity: 1 })
  if (res.ok) {
    inventory.value = res.inventory as InventoryItem[]
    if (res.balance) {
      const b = res.balance as Record<string, unknown>
      userBalance.value = { bipki: b.bipki as number, megabipki: b.megabipki as number }
    }
    showToast("✅ Куплено!", "success")
  } else {
    userBalance.value = prevBalance
    inventory.value = prevInv
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function sellItem(itemId: number, price: number): Promise<void> {
  if (price <= 0) {
    showToast("Цена должна быть > 0", "error")
    return
  }
  if (price < 10) {
    showToast("Минимальная цена: 10🪙", "error")
    return
  }
  hideModal()
  const prevTrades = trades.value
  const prevInv = inventory.value

  inventory.value = inventory.value.filter((i) => i.id !== itemId)

  const res = await api("POST", "/garden/market/sell", { item_id: itemId, price })
  if (res.ok) {
    trades.value = res.trades as TradeItem[]
    inventory.value = res.inventory as InventoryItem[]
    showToast("✅ Выставлено на продажу", "success")
  } else {
    trades.value = prevTrades
    inventory.value = prevInv
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function upgradeItem(itemId: number): Promise<void> {
  const prevInv = inventory.value
  const prevBalance = userBalance.value

  const item = inventory.value.find((i) => i.id === itemId)
  const meta = item?.meta ? JSON.parse(item.meta) : {}
  const newLevel = (meta.level ?? 0) + 1
  inventory.value = inventory.value.map((i) =>
    i.id === itemId
      ? { ...i, meta: JSON.stringify({ ...meta, level: newLevel }) }
      : i,
  )
  userBalance.value = { ...userBalance.value, megabipki: userBalance.value.megabipki - 100 * newLevel }

  const res = await api("POST", "/garden/upgrade", { item_id: itemId })
  if (res.ok) {
    inventory.value = res.inventory as InventoryItem[]
    if (res.balance) {
      const b = res.balance as Record<string, unknown>
      userBalance.value = { bipki: b.bipki as number, megabipki: b.megabipki as number }
    }
    const discovered = res.discovered as boolean
    const subspeciesName = res.subspecies_name as string | null
    if (discovered && subspeciesName) {
      showToast(`🎉 Открыт новый подвид: ${subspeciesName}!`, "success")
    } else {
      showToast(`⬆ Улучшено до уровня ${res.level}!`, "success")
    }
  } else {
    inventory.value = prevInv
    userBalance.value = prevBalance
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function buyTrade(tradeId: number): Promise<void> {
  const prevTrades = trades.value
  const prevInv = inventory.value
  const prevBalance = userBalance.value

  trades.value = trades.value.filter((t) => t.id !== tradeId)

  const res = await api("POST", "/garden/market/buy", { trade_id: tradeId })
  if (res.ok) {
    trades.value = res.trades as TradeItem[]
    inventory.value = res.inventory as InventoryItem[]
    if (res.balance) {
      const b = res.balance as Record<string, unknown>
      userBalance.value = { bipki: b.bipki as number, megabipki: b.megabipki as number }
    }
    showToast("✅ Куплено!", "success")
  } else {
    trades.value = prevTrades
    inventory.value = prevInv
    userBalance.value = prevBalance
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function cancelTrade(tradeId: number): Promise<void> {
  const prevTrades = trades.value
  const prevInv = inventory.value

  trades.value = trades.value.filter((t) => t.id !== tradeId)

  const res = await api("POST", "/garden/market/cancel", { trade_id: tradeId })
  if (res.ok) {
    trades.value = res.trades as TradeItem[]
    inventory.value = res.inventory as InventoryItem[]
    showToast("✅ Лот снят", "success")
  } else {
    trades.value = prevTrades
    inventory.value = prevInv
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function autoSell(idx: number): Promise<void> {
  hideModal()
  const prevPlots = plots.value
  const prevBalance = userBalance.value

  const plot = plots.value.find((p) => p.idx === idx)
  plots.value = plots.value.map((p) =>
    p.idx === idx
      ? { ...p, state: "empty", plant_id: null, planted_at: null, stage: 0, plant_name: undefined, growth_sec: undefined }
      : p,
  )

  const res = await api("POST", "/garden/auto-sell", { idx })
  if (res.ok) {
    plots.value = res.plots as PlotRow[]
    if (res.balance) {
      const b = res.balance as Record<string, unknown>
      userBalance.value = { bipki: b.bipki as number, megabipki: b.megabipki as number }
    }
    showToast(`💰 Продано за 🪙 ${res.price}!`, "success")
  } else {
    plots.value = prevPlots
    userBalance.value = prevBalance
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function autoSellItem(itemId: number): Promise<void> {
  hideModal()
  const prevInv = inventory.value
  const prevBalance = userBalance.value

  inventory.value = inventory.value.filter((i) => i.id !== itemId)

  const res = await api("POST", "/garden/auto-sell-item", { item_id: itemId })
  if (res.ok) {
    inventory.value = res.inventory as InventoryItem[]
    if (res.balance) {
      const b = res.balance as Record<string, unknown>
      userBalance.value = { bipki: b.bipki as number, megabipki: b.megabipki as number }
    }
    showToast(`💰 Продано за 🪙 ${res.price}!`, "success")
  } else {
    inventory.value = prevInv
    userBalance.value = prevBalance
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function craftShards(plantId: number): Promise<void> {
  hideModal()
  const prevInv = inventory.value

  const res = await api("POST", "/garden/craft", { plant_id: plantId })
  if (res.ok) {
    inventory.value = res.inventory as InventoryItem[]
    showToast("🔨 Скрафчено!", "success")
    await loadShard()
  } else {
    inventory.value = prevInv
    showToast((res.error as string) || "Ошибка", "error")
  }
}

export async function buyPlot(): Promise<void> {
  const prevBalance = userBalance.value

  const res = await api("POST", "/garden/buy-plot")
  if (res.ok) {
    if (res.balance) {
      const b = res.balance as Record<string, unknown>
      userBalance.value = { bipki: b.bipki as number, megabipki: b.megabipki as number }
    }
    showToast(`🌱 Грядка куплена! Всего: ${res.plots_max}`, "success")
  } else {
    userBalance.value = prevBalance
    showToast((res.error as string) || "Ошибка", "error")
  }
}
