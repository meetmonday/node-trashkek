import { useSignal } from "@preact/signals"
import { inventory, trades, showModal, hideModal, sellItem, upgradeItem, autoSellItem, getItemEmoji, cancelTrade, userBalance, shardQuantity, craftShards, catalog, loadInventoryAndPlots, loadShard } from "../state"
import type { InventoryItem } from "../types"

function isOnMarket(item: InventoryItem): boolean {
  return item.tradeable === 0
}

function findTradeId(item: InventoryItem): number | null {
  for (const t of trades.value) {
    if (t.item_id === item.id) return t.id
  }
  return null
}

function getItemLevel(item: InventoryItem): number {
  if (!item.meta) return 0
  try {
    const meta = JSON.parse(item.meta)
    return typeof meta.level === "number" ? meta.level : 0
  } catch {
    return 0
  }
}

function getUpgradeCost(currentLevel: number): number {
  return 100 * (currentLevel + 1)
}

function showShardCraft() {
  const plants = catalog.value
  showModal(
    <div>
      <div className="title">🔨 Крафт обломков</div>
      <div className="desc">Выбери растение, чьё базовое семя хочешь получить (5 🪨 = 1 семя):</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {plants.map((p) => (
          <button
            key={p.id}
            className="btn btn-ghost"
            onClick={() => craftShards(p.id)}
            style={{ width: "100%", textAlign: "left" }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <button className="btn btn-ghost" onClick={hideModal}>Отмена</button>
    </div>,
  )
}

function showUpgradeConfirm(item: InventoryItem) {
  const level = getItemLevel(item)
  const cost = getUpgradeCost(level)
  const canAfford = userBalance.value.megabipki >= cost
  const name = item.subspecies_name || item.plant_name || "Предмет"

  showModal(
    <div>
      <div className="title">⬆ Улучшить</div>
      <div className="desc">{name}: {level > 0 ? `+${level}` : "без уровня"} → <strong>+{level + 1}</strong></div>
      <div className="desc mt-4">Стоимость: 💎 {cost}</div>
      <div className="desc mt-4 text-dim">Шанс открыть подвид: рассчитывается на сервере</div>
      <div className="desc" style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={hideModal} style={{ flex: 1 }}>
          Отмена
        </button>
        <button
          className={`btn ${canAfford ? "btn-primary" : "disabled"}`}
          disabled={!canAfford}
          onClick={() => upgradeItem(item.id)}
          style={{ flex: 1 }}
        >
          {canAfford ? "⬆ Улучшить" : "💎 Не хватает"}
        </button>
      </div>
    </div>,
  )
}

function showCancelConfirm(tradeId: number) {
  showModal(
    <div>
      <div className="title">📢 Снять лот</div>
      <div className="desc">Точно снять предмет с продажи? Он вернётся в инвентарь.</div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className="btn btn-ghost" onClick={hideModal} style={{ flex: 1 }}>
          Назад
        </button>
        <button className="btn btn-danger" onClick={() => cancelTrade(tradeId)} style={{ flex: 1 }}>
          Снять
        </button>
      </div>
    </div>,
  )
}

function showSellModal(item: InventoryItem) {
  const itemId = item.id
  const plantName = item.subspecies_name || item.plant_name || "Предмет"
  let marketPrice = 100

  const showMarketInput = () => {
    hideModal()
    showModal(
      <div>
        <div className="title">📢 Рынок</div>
        <div className="desc">Выставить «{plantName}» на рынок. Укажи цену в 🪙 (комиссия 5% с продавца):</div>
        <input
          type="number"
          className="price-input"
          min={10}
          value={marketPrice}
          onInput={(e: Event) => { marketPrice = parseInt((e.target as HTMLInputElement).value, 10) || 0 }}
        />
        <div className="desc text-dim mt-4">Вы получите: 🪙 {Math.floor(marketPrice - Math.ceil(marketPrice * 0.05))}</div>
        <button className="btn btn-gold" onClick={() => sellItem(itemId, marketPrice)} style={{ width: "100%", marginTop: 8 }}>
          Выставить на рынок
        </button>
      </div>,
    )
  }

  showModal(
    <div>
      <div className="title">💰 Продажа</div>
      <div className="desc" style={{ fontSize: 14, textAlign: "center", lineHeight: 1.4 }}>
        {getItemEmoji(item)} <strong>{plantName}</strong>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {item.plant_id === 1 ? (
          <button className="btn btn-gold" onClick={() => autoSellItem(itemId)} style={{ width: "100%" }}>
            ⚡ Продать за 🪙
          </button>
        ) : null}
        <button className="btn btn-primary" onClick={showMarketInput} style={{ width: "100%" }}>
          📢 Выставить на рынок
        </button>
      </div>
    </div>,
  )
}

export function Inventory() {
  const filter = useSignal("all")
  const items = inventory.value.filter((i: InventoryItem) => i.quantity > 0)

  const filtered = items.filter((i) => {
    if (filter.value === "all") return true
    if (filter.value === "seed") return i.type === "seed"
    if (filter.value === "harvest") return i.type === "harvest"
    if (filter.value === "shard") return i.type === "shard"
    if (filter.value === "market") return isOnMarket(i)
    return true
  })

  const allCount = items.length
  const seedCount = items.filter((i) => i.type === "seed").length
  const harvestCount = items.filter((i) => i.type === "harvest").length
  const shardCount = items.filter((i) => i.type === "shard").length
  const marketCount = items.filter((i) => isOnMarket(i)).length

  return (
    <div>
      <div className="inv-filters">
        <button className={`filter-pill ${filter.value === "all" ? "active" : ""}`} onClick={() => { filter.value = "all" }}>
          Всё ({allCount})
        </button>
        <button className={`filter-pill ${filter.value === "seed" ? "active" : ""}`} onClick={() => { filter.value = "seed" }}>
          🌱 Семена ({seedCount})
        </button>
        <button className={`filter-pill ${filter.value === "harvest" ? "active" : ""}`} onClick={() => { filter.value = "harvest" }}>
          🎁 Урожай ({harvestCount})
        </button>
        {shardCount > 0 ? (
          <button className={`filter-pill ${filter.value === "shard" ? "active" : ""}`} onClick={() => { filter.value = "shard" }}>
            🪨 Обломки ({shardCount})
          </button>
        ) : null}
        {marketCount > 0 ? (
          <button className={`filter-pill ${filter.value === "market" ? "active" : ""}`} onClick={() => { filter.value = "market" }}>
            📢 В продаже ({marketCount})
          </button>
        ) : null}
      </div>
      <div className="inv-grid">
        {!filtered.length ? (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <div className="empty-text">Пусто</div>
            <div className="empty-hint">Купи семена в магазине</div>
          </div>
        ) : null}
        {filtered.map((item) => (
          <InventoryCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function InventoryCard({ item }: { item: InventoryItem }) {
  const emoji = getItemEmoji(item)
  const onMarket = isOnMarket(item)
  const tradeId = onMarket ? findTradeId(item) : null
  const typeLabel = item.type === "seed" ? "семян" : item.type === "shard" ? "шт" : "шт"
  const level = item.type !== "shard" ? getItemLevel(item) : 0
  const rarity = item.rarity
  const displayName = item.subspecies_name || item.plant_name || "Предмет"

  const classes = ["inv-card"]
  if (onMarket) classes.push("on-market")

  return (
    <div className={classes.join(" ")}>
      {onMarket ? <div className="market-badge">📢 На рынке</div> : null}
      <div className="inv-icon">{emoji}</div>
      <div className="inv-name">
        {displayName}
        {rarity ? <span className={`rarity-badge ${rarity}`} style={{ marginLeft: 4 }}>{rarity}</span> : null}
      </div>
      <div className="inv-qty">
        ×{item.quantity} {typeLabel}
        {level > 0 ? <span style={{ color: "var(--gold)", marginLeft: 4 }}>+{level}</span> : null}
      </div>
      <div className="inv-actions">
        {item.type === "shard" ? (
          <button
            className="btn btn-primary btn-xs"
            onClick={showShardCraft}
            style={{ width: "100%" }}
            disabled={shardQuantity.value < 5}
          >
            🔨 Крафт ({shardQuantity.value}/5)
          </button>
        ) : onMarket && tradeId ? (
          <button className="btn btn-danger btn-xs" onClick={() => showCancelConfirm(tradeId)} style={{ width: "100%" }}>
            Снять
          </button>
        ) : (
          <>
            {item.type === "harvest" ? (
              <>
                <button className="btn btn-gold btn-xs" onClick={() => showSellModal(item)}>
                  💰 Продать
                </button>
                <button className="btn btn-xs" style={{ background: "var(--accent2)", color: "#fff" }} onClick={() => showUpgradeConfirm(item)}>
                  ⬆ Улучшить
                </button>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
