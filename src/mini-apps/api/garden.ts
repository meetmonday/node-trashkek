import { registerRoute } from "../server"
import type { InitData } from "../auth"
import { GardenManager } from "../manager"
import { getBipBank } from "@/economy/bipbank"

function uid(auth: InitData): number {
  return auth.userId
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

let _garden: GardenManager | null = null

function garden(): GardenManager {
  if (!_garden) {
    _garden = new GardenManager(() => getBipBank())
  }
  return _garden
}

export function createGardenRouter(): void {
  const g = garden()

  registerRoute("GET", "/api/user/balance", (auth) => {
    return json({ ok: true, ...g.getBalance(uid(auth)) })
  })

  registerRoute("GET", "/api/garden/plots", (auth) => {
    const plots = g.getPlots(uid(auth))
    return json({ ok: true, plots })
  })

  registerRoute("POST", "/api/garden/plant", (auth, body) => {
    const { idx, item_id } = (body ?? {}) as Record<string, unknown>
    if (typeof idx !== "number" || typeof item_id !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.plantSeed(userId, idx, item_id)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      germinated: result.data.germinated,
      plots: g.getPlots(userId),
      inventory: g.getInventory(userId),
    })
  })

  registerRoute("POST", "/api/garden/harvest", (auth, body) => {
    const { idx } = (body ?? {}) as Record<string, unknown>
    if (typeof idx !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.harvestPlot(userId, idx)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      plots: g.getPlots(userId),
      inventory: g.getInventory(userId),
    })
  })

  registerRoute("POST", "/api/garden/auto-sell", (auth, body) => {
    const { idx } = (body ?? {}) as Record<string, unknown>
    if (typeof idx !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.autoSellHarvest(userId, idx)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      price: result.data.price,
      plots: g.getPlots(userId),
      balance: g.getBalance(userId),
    })
  })

  registerRoute("POST", "/api/garden/auto-sell-item", (auth, body) => {
    const { item_id } = (body ?? {}) as Record<string, unknown>
    if (typeof item_id !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.autoSellItem(userId, item_id)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      price: result.data.price,
      inventory: g.getInventory(userId),
      balance: g.getBalance(userId),
    })
  })

  registerRoute("POST", "/api/garden/clear", (auth, body) => {
    const { idx } = (body ?? {}) as Record<string, unknown>
    if (typeof idx !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    return json(g.clearPlot(uid(auth), idx))
  })

  registerRoute("GET", "/api/garden/shop", (auth) => {
    const userId = uid(auth)
    return json({
      ok: true,
      catalog: g.getCatalog(),
      balance: g.getBalance(userId),
    })
  })

  registerRoute("POST", "/api/garden/buy", (auth, body) => {
    const { plant_id, quantity = 1 } = (body ?? {}) as Record<string, unknown>
    if (typeof plant_id !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.buySeed(userId, plant_id, Number(quantity))
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      inventory: g.getInventory(userId),
      balance: g.getBalance(userId),
    })
  })

  registerRoute("GET", "/api/garden/inventory", (auth) => {
    const items = g.getInventory(uid(auth))
    return json({ ok: true, items })
  })

  registerRoute("GET", "/api/garden/shard-quantity", (auth) => {
    return json({ ok: true, quantity: g.getShardQuantity(uid(auth)) })
  })

  registerRoute("POST", "/api/garden/craft", (auth, body) => {
    const { plant_id } = (body ?? {}) as Record<string, unknown>
    if (typeof plant_id !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.craftShards(userId, plant_id)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      inventory: g.getInventory(userId),
    })
  })

  registerRoute("POST", "/api/garden/buy-plot", (auth) => {
    const userId = uid(auth)
    const result = g.buyPlot(userId)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      plots_max: result.data.plots_max,
      balance: g.getBalance(userId),
    })
  })

  registerRoute("GET", "/api/garden/discoveries", (auth) => {
    return json({ ok: true, discoveries: g.getDiscoveries(uid(auth)) })
  })

  registerRoute("POST", "/api/garden/upgrade", (auth, body) => {
    const { item_id } = (body ?? {}) as Record<string, unknown>
    if (typeof item_id !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.upgradeItem(userId, item_id)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      level: result.data.level,
      discovered: result.data.discovered ?? false,
      subspecies_name: result.data.subspecies_name ?? null,
      inventory: g.getInventory(userId),
      balance: g.getBalance(userId),
    })
  })

  registerRoute("GET", "/api/garden/market", (auth) => {
    return json({ ok: true, trades: g.getMarketTrades(uid(auth)) })
  })

  registerRoute("POST", "/api/garden/market/sell", (auth, body) => {
    const { item_id, price } = (body ?? {}) as Record<string, unknown>
    if (typeof item_id !== "number" || typeof price !== "number" || price <= 0) {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.sellOnMarket(userId, item_id, price)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      trades: g.getMarketTrades(userId),
      inventory: g.getInventory(userId),
    })
  })

  registerRoute("POST", "/api/garden/market/buy", (auth, body) => {
    const { trade_id } = (body ?? {}) as Record<string, unknown>
    if (typeof trade_id !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.buyFromMarket(userId, trade_id)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      trades: g.getMarketTrades(userId),
      inventory: g.getInventory(userId),
      balance: g.getBalance(userId),
    })
  })

  registerRoute("POST", "/api/garden/market/cancel", (auth, body) => {
    const { trade_id } = (body ?? {}) as Record<string, unknown>
    if (typeof trade_id !== "number") {
      return json({ ok: false, error: "Invalid params" }, 400)
    }
    const userId = uid(auth)
    const result = g.cancelTrade(userId, trade_id)
    if (!result.ok) return json(result, 400)
    return json({
      ok: true,
      trades: g.getMarketTrades(userId),
      inventory: g.getInventory(userId),
    })
  })
}
