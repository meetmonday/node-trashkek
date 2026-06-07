export interface PlantRow {
  id: number
  name: string
  description: string | null
  seed_price: number
  growth_sec: number
  max_level: number
  created_at: string
}

export interface SubspeciesRow {
  id: number
  plant_id: number
  name: string
  rarity: string
  emoji: string
  price_mult: number
  growth_mult: number
  germination_chance: number
  discover_weight: number
  created_at: string
}

export interface PlotRow {
  id: number
  user_id: number
  idx: number
  plant_id: number | null
  subspecies_id: number | null
  planted_at: string | null
  withered_at: string | null
  stage: number
  level: number
  state: string
  plant_name?: string
  growth_sec?: number
  subspecies_name?: string
  subspecies_emoji?: string
  rarity?: string
}

export type InventoryType = "seed" | "harvest" | "shard"

export interface InventoryRow {
  id: number
  user_id: number
  type: string
  plant_id: number | null
  subspecies_id: number | null
  meta: string | null
  quantity: number
  tradeable: number
  created_at: string
  plant_name?: string
  rarity?: string
  subspecies_name?: string
  subspecies_emoji?: string
}

export interface TradeRow {
  id: number
  seller_id: number
  item_id: number
  price: number
  status: string
  created_at: string
  is_own?: boolean
  plant_name?: string
  rarity?: string
  item_type?: string
  subspecies_name?: string
  subspecies_emoji?: string
  meta?: string
}

export interface Balance {
  bipki: number
  megabipki: number
}

export interface ShopItem extends PlantRow {
  subspecies_count: number
}

export interface DiscoveryRow {
  id: number
  user_id: number
  subspecies_id: number
  discovered_at: string
  subspecies_name?: string
  subspecies_emoji?: string
  rarity?: string
  plant_name?: string
  plant_id?: number
}

export interface PlotsOwnedRow {
  id: number
  user_id: number
  plots_max: number
}

export interface QuestRow {
  id: number
  user_id: number
  quest_id: number
  progress: number
  target: number
  reward: string
  claimed: number
  date: string
}

export type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }
