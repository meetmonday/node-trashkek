import { showModal, hideModal, trades, buyTrade, cancelTrade } from "../state"
import type { TradeItem } from "../types"

function getTradeEmoji(trade: TradeItem): string {
  if (trade.subspecies_emoji) return trade.subspecies_emoji
  if (trade.item_type === "seed") return "🌱"
  if (trade.rarity === "legendary") return "🌟"
  if (trade.rarity === "epic") return "💜"
  if (trade.rarity === "rare") return "🔮"
  return "📦"
}

function showBuyConfirm(trade: TradeItem) {
  const fee = Math.ceil(trade.price * 0.05)
  const sellerPayout = trade.price - fee

  showModal(
    <div>
      <div className="title">🏪 Подтверждение</div>
      <div className="desc" style={{ textAlign: "center", fontSize: 40, lineHeight: 1.4 }}>
        {getTradeEmoji(trade)}
      </div>
      <div className="desc" style={{ textAlign: "center", fontWeight: 600 }}>
        {trade.plant_name || "Предмет"}
        {trade.subspecies_name ? <div className="text-dim">{trade.subspecies_name}</div> : null}
        {trade.rarity ? <span className={`rarity-badge ${trade.rarity}`} style={{ marginLeft: 6 }}>{trade.rarity}</span> : null}
      </div>
      <div className="desc text-center mt-4">
        Цена: 🪙 {trade.price}
      </div>
      <div className="desc text-center text-dim">
        Продавец получает: 🪙 {sellerPayout} (комиссия 5%)
      </div>
      <div className="desc text-center text-dim">
        Продавец: user{trade.seller_id}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={hideModal} style={{ flex: 1 }}>
          Назад
        </button>
        <button className="btn btn-primary" onClick={() => buyTrade(trade.id)} style={{ flex: 1 }}>
          Купить
        </button>
      </div>
    </div>,
  )
}

function MarketCard({ trade }: { trade: TradeItem }) {
  return (
    <div className="market-card">
      <div className="market-icon">{getTradeEmoji(trade)}</div>
      <div className="market-info">
        <div className="market-name">
          {trade.plant_name || "Предмет"}
          {trade.subspecies_name ? <span className="text-dim" style={{ marginLeft: 4, fontSize: 11 }}>{trade.subspecies_name}</span> : null}
          {trade.rarity ? <span className={`rarity-badge ${trade.rarity}`}>{trade.rarity}</span> : null}
        </div>
        <div className="market-seller">
          {trade.is_own ? "Ваш лот" : `Продавец: user${trade.seller_id}`}
        </div>
      </div>
      <div className="market-price">
        🪙 {trade.price}
      </div>
      <div className="market-action">
        {trade.is_own ? (
          <button className="btn btn-danger btn-sm" onClick={() => cancelTrade(trade.id)}>
            Отменить
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => showBuyConfirm(trade)}>
            Купить
          </button>
        )}
      </div>
    </div>
  )
}

export function Market() {
  const items = trades.value

  if (!items.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏪</div>
        <div className="empty-text">Объявлений нет</div>
        <div className="empty-hint">Продай свой урожай первым!</div>
      </div>
    )
  }

  return (
    <div className="market-list">
      {items.map((trade) => (
        <MarketCard key={trade.id} trade={trade} />
      ))}
    </div>
  )
}
