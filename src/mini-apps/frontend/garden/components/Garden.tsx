import { plots, inventory, getTimerDisplay, getPlotProgress, getStageEmoji, isPlotReady, plantSeed, onHarvest, showModal, hideModal, modalVisible, plotInfoPlot, autoSell, getStageEmoji as getEmoji, activeView } from "../state"
import type { PlotRow, InventoryItem } from "../types"

function showSeedPicker(plotIdx: number) {
  const seeds = inventory.value.filter((i: InventoryItem) => i.type === "seed" && i.quantity > 0)
  if (!seeds.length) {
    showModal(
      <div>
        <div className="title">🌱 Нет семян</div>
        <div className="desc">У тебя нет семян. Купи их в магазине.</div>
        <button className="btn btn-primary" onClick={() => { hideModal(); activeView.value = "shop" }}>
          🛒 В магазин
        </button>
      </div>,
    )
    return
  }

  showModal(
    <div>
      <div className="title">🌱 Выбери семена</div>
      <div className="seed-picker-grid">
        {seeds.map((s) => (
          <div key={s.id} className="seed-card" onClick={() => plantSeed(plotIdx, s.id)}>
            <div className="seed-emoji">{s.subspecies_emoji || "🌱"}</div>
            <div className="seed-name">{s.plant_name || "Растение"}{s.subspecies_name ? ` (${s.subspecies_name})` : ""}</div>
            {s.rarity ? <div className={`rarity-badge ${s.rarity} seed-badge`}>{s.rarity}</div> : null}
            <div className="seed-qty">×{s.quantity}</div>
          </div>
        ))}
      </div>
    </div>,
  )
}

function showHarvestOptions(idx: number, plot: PlotRow) {
  showModal(
    <div>
      <div className="text-center" style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 48, lineHeight: 1.2 }}>{getStageEmoji(plot)}</div>
        <div className="title">{plot.plant_name || "Растение"}</div>
        {plot.rarity ? <span className={`rarity-badge ${plot.rarity}`}>{plot.rarity}</span> : null}
        {plot.subspecies_name && plot.rarity !== "common" ? <div className="desc text-center">{plot.subspecies_name}</div> : null}
      </div>
      <div className="desc text-center text-dim">
        Урожай готов! Что делаем?
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        <button className="btn btn-success" onClick={() => onHarvest(idx)} style={{ width: "100%" }}>
          🎁 В инвентарь
        </button>
        {plot.plant_id === 1 ? (
          <button className="btn btn-gold" onClick={() => autoSell(idx)} style={{ width: "100%" }}>
            💰 Продать за 🪙
          </button>
        ) : null}
      </div>
    </div>,
  )
}

function Plot({ plot }: { plot: PlotRow }) {
  const ready = plot.state === "ready" || (plot.state === "growing" && isPlotReady(plot))

  const handleClick = () => {
    if (plot.state === "empty") {
      showSeedPicker(plot.idx)
    } else if (plot.state === "withered") {
      plotInfoPlot.value = plot
      modalVisible.value = true
    } else if (ready) {
      showHarvestOptions(plot.idx, plot)
    } else {
      plotInfoPlot.value = plot
      modalVisible.value = true
    }
  }

  if (plot.state === "empty") {
    return (
      <div className="plot empty" onClick={handleClick}>
        <div className="plot-plus">+</div>
        <div className="plot-label">Посадить</div>
      </div>
    )
  }

  if (plot.state === "withered") {
    return (
      <div className="plot withered" onClick={handleClick}>
        <div className="plot-emoji">🥀</div>
        <div className="plot-timer" data-plot-idx={plot.idx}>{getTimerDisplay(plot)}</div>
      </div>
    )
  }

  const displayState = ready ? "ready" : "growing"
  const classes = ["plot", displayState]
  if (plot.rarity) classes.push(`rarity-${plot.rarity}`)

  if (ready) {
    return (
      <div className={classes.join(" ")} onClick={handleClick}>
        <div className="plot-sparkle" />
        <div className="plot-emoji">{getStageEmoji(plot)}</div>
        <div className="plot-harvest-label">✨ Собрать!</div>
        {plot.plant_name ? <div className="plot-name">{plot.plant_name}</div> : null}
        {plot.subspecies_name && plot.rarity !== "common" ? <div className="plot-sub-name">{plot.subspecies_name}</div> : null}
      </div>
    )
  }

  const progress = getPlotProgress(plot)

  return (
    <div className={classes.join(" ")} onClick={handleClick}>
      <div className="plot-emoji">{getStageEmoji(plot)}</div>
      {plot.plant_name ? <div className="plot-name">{plot.plant_name}</div> : null}
      <div className="plot-timer" data-plot-idx={plot.idx}>{getTimerDisplay(plot)}</div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export function Garden() {
  const p = plots.value
  if (!p.length) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <div className="garden-grid">
      {p.map((plot) => (
        <Plot key={plot.idx} plot={plot} />
      ))}
    </div>
  )
}
