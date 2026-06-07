import type { Database, Statement, SQLQueryBindings } from "bun:sqlite"
import type {
  PlantRow, SubspeciesRow, PlotRow, InventoryRow,
  TradeRow, DiscoveryRow, PlotsOwnedRow, QuestRow,
} from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

function q<T extends Row>(db: Database, sql: string): Statement<T, SQLQueryBindings[]> {
  return db.query<T, SQLQueryBindings[]>(sql)
}

function row<T extends Row>(db: Database, sql: string, ...params: SQLQueryBindings[]): T | undefined {
  return q<T>(db, sql).get(...params) ?? undefined
}

function rows<T extends Row>(db: Database, sql: string, ...params: SQLQueryBindings[]): T[] {
  return q<T>(db, sql).all(...params)
}

function run(db: Database, sql: string, ...bindings: SQLQueryBindings[]): void {
  db.run(sql, bindings)
}

function ensurePlots(db: Database, userId: number): void {
  const existing = row<{ cnt: number }>(db, "SELECT COUNT(*) as cnt FROM garden_plots WHERE user_id = ?", userId)
  if (existing && existing.cnt > 0) return

  const insert = db.prepare("INSERT OR IGNORE INTO garden_plots (user_id, idx, state) VALUES (?, ?, 'empty')")
  for (let i = 0; i < 9; i++) {
    insert.run(userId, i)
  }
}

function ensurePlotsOwned(db: Database, userId: number): void {
  run(db, "INSERT OR IGNORE INTO garden_plots_owned (user_id, plots_max) VALUES (?, 1)", userId)
}

export function createGardenDbApi(db: Database) {
  return {
    transaction<T>(fn: () => T): T {
      return db.transaction(fn)()
    },

    plots: {
      all(userId: number): PlotRow[] {
        ensurePlots(db, userId)
        const now = Date.now()

        const plots = rows<PlotRow>(
          db,
          `SELECT p.*, pl.name as plant_name, pl.growth_sec,
                  s.name as subspecies_name, s.emoji as subspecies_emoji, s.rarity
           FROM garden_plots p
           LEFT JOIN garden_plants pl ON pl.id = p.plant_id
           LEFT JOIN garden_subspecies s ON s.id = p.subspecies_id
           WHERE p.user_id = ?
           ORDER BY p.idx`,
          userId,
        )

        for (const plot of plots) {
          if (plot.state === "growing" && plot.planted_at && plot.growth_sec) {
            const planted = new Date(plot.planted_at + "Z").getTime()
            if ((now - planted) / 1000 >= plot.growth_sec) {
              plot.state = "ready"
            }
          }

          if (plot.state === "withered" && plot.withered_at) {
            const withered = new Date(plot.withered_at + "Z").getTime()
            if ((now - withered) / 1000 > 15) {
              run(db,
                `UPDATE garden_plots SET state = 'empty', plant_id = NULL, subspecies_id = NULL,
                 planted_at = NULL, stage = 0, level = 0, withered_at = NULL
                 WHERE id = ?`,
                plot.id,
              )
              plot.state = "empty"
              plot.plant_id = null
              plot.subspecies_id = null
              plot.planted_at = null
              plot.withered_at = null
              plot.stage = 0
              plot.level = 0
              plot.plant_name = undefined
              plot.subspecies_name = undefined
              plot.subspecies_emoji = undefined
              plot.rarity = undefined
              plot.growth_sec = undefined
            }
          }
        }

        return plots
      },

      updateState(
        db2: Database, userId: number, idx: number, state: string,
        plantId: number | null = null,
        subspeciesId: number | null = null,
        extra: { planted_at?: string; stage?: number; withered_at?: string } = {},
      ): void {
        if (state === "growing") {
          run(db2,
            `UPDATE garden_plots SET state = 'growing', plant_id = ?, subspecies_id = ?,
             planted_at = datetime('now'), stage = 1, withered_at = NULL
             WHERE user_id = ? AND idx = ?`,
            plantId, subspeciesId, userId, idx,
          )
        } else if (state === "withered") {
          run(db2,
            `UPDATE garden_plots SET state = 'withered', withered_at = datetime('now')
             WHERE user_id = ? AND idx = ?`,
            userId, idx,
          )
        } else {
          run(db2,
            `UPDATE garden_plots SET state = ?, plant_id = NULL, subspecies_id = NULL,
             planted_at = NULL, stage = 0, level = 0, withered_at = NULL
             WHERE user_id = ? AND idx = ?`,
            state, userId, idx,
          )
        }
      },
    },

    catalog: {
      all(): (PlantRow & { subspecies_count: number })[] {
        return rows<(PlantRow & { subspecies_count: number })>(
          db,
          `SELECT p.*, COUNT(s.id) as subspecies_count
           FROM garden_plants p
           LEFT JOIN garden_subspecies s ON s.plant_id = p.id
           GROUP BY p.id
           ORDER BY p.seed_price`,
        )
      },

      byId(id: number): PlantRow & { subspecies_count?: number } | undefined {
        return row<PlantRow & { subspecies_count?: number }>(
          db,
          "SELECT * FROM garden_plants WHERE id = ?", id,
        )
      },
    },

    subspecies: {
      byId(id: number): SubspeciesRow | undefined {
        return row<SubspeciesRow>(db, "SELECT * FROM garden_subspecies WHERE id = ?", id)
      },

      byPlant(plantId: number): SubspeciesRow[] {
        return rows<SubspeciesRow>(
          db,
          "SELECT * FROM garden_subspecies WHERE plant_id = ? ORDER BY id",
          plantId,
        )
      },

      baseForPlant(plantId: number): SubspeciesRow | undefined {
        return row<SubspeciesRow>(
          db,
          "SELECT * FROM garden_subspecies WHERE plant_id = ? AND rarity = 'common' ORDER BY id LIMIT 1",
          plantId,
        )
      },
    },

    inventory: {
      all(userId: number): InventoryRow[] {
        return rows<InventoryRow>(
          db,
          `SELECT i.*, pl.name as plant_name,
                  s.name as subspecies_name, s.emoji as subspecies_emoji, s.rarity
           FROM garden_inventory i
           LEFT JOIN garden_plants pl ON pl.id = i.plant_id
           LEFT JOIN garden_subspecies s ON s.id = i.subspecies_id
           WHERE i.user_id = ?
           ORDER BY i.created_at DESC`,
          userId,
        )
      },

      byId(itemId: number): InventoryRow | undefined {
        return row<InventoryRow>(db, "SELECT * FROM garden_inventory WHERE id = ?", itemId)
      },

      byUserAndPlant(userId: number, plantId: number, type: string): InventoryRow | undefined {
        return row<InventoryRow>(
          db,
          "SELECT * FROM garden_inventory WHERE user_id = ? AND plant_id = ? AND type = ? AND subspecies_id IS NULL ORDER BY id DESC LIMIT 1",
          userId, plantId, type,
        )
      },

      add(
        db2: Database, userId: number, type: string, plantId: number,
        quantity = 1, meta: string | null = null,
        subspeciesId: number | null = null,
      ): void {
        run(db2,
          "INSERT INTO garden_inventory (user_id, type, plant_id, subspecies_id, quantity, meta) VALUES (?, ?, ?, ?, ?, ?)",
          userId, type, plantId, subspeciesId, quantity, meta,
        )
      },

      subtract(db2: Database, itemId: number): void {
        run(db2, "UPDATE garden_inventory SET quantity = quantity - 1 WHERE id = ?", itemId)
        run(db2, "DELETE FROM garden_inventory WHERE id = ? AND quantity <= 0", itemId)
      },

      setTradeable(db2: Database, itemId: number, tradeable: number): void {
        run(db2, "UPDATE garden_inventory SET tradeable = ? WHERE id = ?", tradeable, itemId)
      },

      transfer(db2: Database, itemId: number, newOwnerId: number): void {
        run(db2, "UPDATE garden_inventory SET user_id = ?, tradeable = 1 WHERE id = ?", newOwnerId, itemId)
      },

      updateMeta(db2: Database, itemId: number, meta: string): void {
        run(db2, "UPDATE garden_inventory SET meta = ? WHERE id = ?", meta, itemId)
      },

      getOrCreateShardRow(
        db2: Database, userId: number, quantity = 0,
      ): { id: number; quantity: number } {
        const existing = row<{ id: number; quantity: number }>(
          db2,
          "SELECT id, quantity FROM garden_inventory WHERE user_id = ? AND type = 'shard'",
          userId,
        )
        if (existing) {
          run(db2, "UPDATE garden_inventory SET quantity = quantity + ? WHERE id = ?", quantity, existing.id)
          return { id: existing.id, quantity: existing.quantity + quantity }
        }
        run(db2,
          "INSERT INTO garden_inventory (user_id, type, plant_id, subspecies_id, quantity, tradeable) VALUES (?, 'shard', NULL, NULL, ?, 0)",
          userId, quantity,
        )
        return { id: 0, quantity }
      },

      shardQuantity(userId: number): number {
        const shard = row<{ quantity: number }>(
          db,
          "SELECT quantity FROM garden_inventory WHERE user_id = ? AND type = 'shard'",
          userId,
        )
        return shard?.quantity ?? 0
      },
    },

    trades: {
      all(): TradeRow[] {
        return rows<TradeRow>(
          db,
          `SELECT t.*, i.type as item_type, i.plant_id, p.name as plant_name,
                  s.name as subspecies_name, s.emoji as subspecies_emoji, s.rarity, i.meta
           FROM garden_trades t
           JOIN garden_inventory i ON i.id = t.item_id
           LEFT JOIN garden_plants p ON p.id = i.plant_id
           LEFT JOIN garden_subspecies s ON s.id = i.subspecies_id
           WHERE t.status = 'active'
           ORDER BY t.created_at DESC`,
        )
      },

      byId(tradeId: number): TradeRow | undefined {
        return row<TradeRow>(db, "SELECT * FROM garden_trades WHERE id = ? AND status = 'active'", tradeId)
      },

      byItemId(itemId: number): TradeRow | undefined {
        return row<TradeRow>(db, "SELECT id FROM garden_trades WHERE item_id = ? AND status = 'active'", itemId)
      },

      create(db2: Database, sellerId: number, itemId: number, price: number): void {
        run(db2, "INSERT INTO garden_trades (seller_id, item_id, price) VALUES (?, ?, ?)",
          sellerId, itemId, price,
        )
      },

      markSold(db2: Database, tradeId: number): void {
        run(db2, "UPDATE garden_trades SET status = 'sold' WHERE id = ?", tradeId)
      },

      markCancelled(db2: Database, tradeId: number): void {
        run(db2, "UPDATE garden_trades SET status = 'cancelled' WHERE id = ?", tradeId)
      },
    },

    discoveries: {
      all(userId: number): DiscoveryRow[] {
        return rows<DiscoveryRow>(
          db,
          `SELECT d.*, s.name as subspecies_name, s.emoji as subspecies_emoji, s.rarity, p.name as plant_name, p.id as plant_id
           FROM garden_discoveries d
           JOIN garden_subspecies s ON s.id = d.subspecies_id
           JOIN garden_plants p ON p.id = s.plant_id
           WHERE d.user_id = ?
           ORDER BY d.discovered_at DESC`,
          userId,
        )
      },

      count(userId: number, plantId: number): number {
        const result = row<{ cnt: number }>(
          db,
          `SELECT COUNT(*) as cnt FROM garden_discoveries d
           JOIN garden_subspecies s ON s.id = d.subspecies_id
           WHERE d.user_id = ? AND s.plant_id = ?`,
          userId, plantId,
        )
        return result?.cnt ?? 0
      },

      undiscovered(userId: number, plantId: number): SubspeciesRow[] {
        return rows<SubspeciesRow>(
          db,
          `SELECT s.* FROM garden_subspecies s
           WHERE s.plant_id = ? AND s.id NOT IN (
             SELECT subspecies_id FROM garden_discoveries WHERE user_id = ?
           )
           ORDER BY s.id`,
          plantId, userId,
        )
      },

      create(db2: Database, userId: number, subspeciesId: number): void {
        run(db2,
          "INSERT OR IGNORE INTO garden_discoveries (user_id, subspecies_id) VALUES (?, ?)",
          userId, subspeciesId,
        )
      },
    },

    plotsOwned: {
      get(userId: number): PlotsOwnedRow | undefined {
        ensurePlotsOwned(db, userId)
        return row<PlotsOwnedRow>(
          db,
          "SELECT * FROM garden_plots_owned WHERE user_id = ?",
          userId,
        )
      },

      increment(db2: Database, userId: number): void {
        run(db2,
          "UPDATE garden_plots_owned SET plots_max = plots_max + 1 WHERE user_id = ?",
          userId,
        )
      },
    },
  }
}

export type GardenDbApi = ReturnType<typeof createGardenDbApi>
