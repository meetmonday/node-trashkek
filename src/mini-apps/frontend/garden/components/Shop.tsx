import { catalog, userBalance, buyPlant } from "../state"
import type { CatalogItem } from "../types"

function formatTime(sec: number): string {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    return `${h}ч ${m}м`
  }
  if (sec >= 60) {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${String(s).padStart(2, "0")}`
  }
  return `${Math.floor(sec)}с`
}

export function Shop() {
  const items = catalog.value

  if (!items.length) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <div>
      <div className="shop-list">
        {items.map((plant) => {
          const canAfford = userBalance.value.bipki >= plant.seed_price
          return (
            <div key={plant.id} className="shop-card">
              <div className="shop-icon">{plant.name.split(" ")[0] || "🌱"}</div>
              <div className="shop-info">
                <div className="shop-name">
                  {plant.name}
                </div>
                {plant.description ? <div className="shop-desc">{plant.description}</div> : null}
                <div className="shop-tags">
                  <span className="shop-tag">⏱ {formatTime(plant.growth_sec)}</span>
                  <span className="shop-tag">📈 Ур. {plant.max_level}</span>
                  {plant.subspecies_count > 1 ? <span className="shop-tag">🌿 {plant.subspecies_count} подвида</span> : null}
                </div>
              </div>
              <div className="shop-action">
                <div className="shop-price bipki">🪙 {plant.seed_price}</div>
                <button
                  className={`btn ${canAfford ? "btn-primary" : "disabled"}`}
                  disabled={!canAfford}
                  onClick={() => buyPlant(plant.id)}
                >
                  Купить
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
