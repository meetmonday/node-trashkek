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

export interface CatalogItem {
  id: number
  name: string
  description: string | null
  seed_price: number
  growth_sec: number
  max_level: number
  subspecies_count: number
}

export interface InventoryItem {
  id: number
  type: string
  plant_id: number | null
  subspecies_id: number | null
  quantity: number
  tradeable: number
  plant_name?: string
  rarity?: string
  subspecies_name?: string
  subspecies_emoji?: string
  meta?: string
}

export interface TradeItem {
  id: number
  seller_id: number
  item_id: number
  price: number
  is_own?: boolean
  plant_name?: string
  rarity?: string
  subspecies_name?: string
  subspecies_emoji?: string
  item_type?: string
  plant_id?: number | null
}

export interface Balance {
  bipki: number
  megabipki: number
}

export interface DiscoveryItem {
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
