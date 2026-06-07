import { activeView, userBalance } from "../state"
import { Garden } from "./Garden"
import { Shop } from "./Shop"
import { Inventory } from "./Inventory"
import { Market } from "./Market"
import { Modal } from "./Modal"
import { Toast } from "./Toast"

const TABS = [
  { id: "garden", label: "Огород", icon: "🌻" },
  { id: "shop", label: "Магазин", icon: "🛒" },
  { id: "inventory", label: "Инвентарь", icon: "📦" },
  { id: "market", label: "Рынок", icon: "🏪" },
] as const

function CurrentView() {
  switch (activeView.value) {
    case "garden":
      return <Garden />
    case "shop":
      return <Shop />
    case "inventory":
      return <Inventory />
    case "market":
      return <Market />
    default:
      return <Garden />
  }
}

export function App() {
  return (
    <div id="app">
      <header id="header">
        <div className="header-top">
          <div className="header-title">
            🌻 <span>Огород</span>
          </div>
          <div className="balance-bar">
            <div className="balance-item bipki">🪙 {userBalance.value.bipki ?? 0}</div>
            <div className="balance-item mega">💎 {userBalance.value.megabipki ?? 0}</div>
          </div>
        </div>
      </header>
      <main id="content">
        <CurrentView />
      </main>
      <nav id="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeView.value === tab.id ? "active" : ""}`}
            onClick={() => { activeView.value = tab.id }}
          >
            <div className="nav-icon">{tab.icon}</div>
            <div className="nav-label">{tab.label}</div>
          </button>
        ))}
      </nav>
      <Modal />
      <Toast />
    </div>
  )
}
