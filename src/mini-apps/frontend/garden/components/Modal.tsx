import type { ComponentChildren } from "preact"
import { modalVisible, modalContent, plotInfoPlot, hideModal, getTimerDisplay, getPlotProgress, getStageEmoji } from "../state"
import type { PlotRow } from "../types"

function PlotInfo({ plot }: { plot: PlotRow }) {
  const progress = getPlotProgress(plot)
  const emoji = getStageEmoji(plot)

  if (plot.state === "withered") {
    return (
      <div>
        <div className="text-center" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 48, lineHeight: 1.2 }}>🥀</div>
          <div className="title">{plot.plant_name || "Растение"}</div>
        </div>
        <div className="desc text-center">
          🌱 Семя не взошло... Грядка восстановится через {getTimerDisplay(plot)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 48, lineHeight: 1.2 }}>{emoji}</div>
        <div className="title">{plot.plant_name || "Растение"}</div>
        {plot.rarity ? <span className={`rarity-badge ${plot.rarity}`}>{plot.rarity}</span> : null}
        {plot.subspecies_name && plot.rarity !== "common" ? <div className="desc text-center mt-4">{plot.subspecies_name}</div> : null}
      </div>
      <div className="desc" style={{ textAlign: "center" }}>
        ⏱ {getTimerDisplay(plot)}
      </div>
      <div className="mt-4" style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: 8, borderRadius: 4, background: "linear-gradient(90deg, var(--success), var(--gold))", transition: "width 1s linear" }} />
      </div>
    </div>
  )
}

export function Modal() {
  if (!modalVisible.value) return null

  return (
    <div className="modal-overlay" onClick={hideModal}>
      <div className="modal-content" onClick={(e: Event) => e.stopPropagation()}>
        {plotInfoPlot.value ? <PlotInfo plot={plotInfoPlot.value} /> : (modalContent.value as ComponentChildren)}
        <button className="btn btn-ghost" onClick={hideModal}>Закрыть</button>
      </div>
    </div>
  )
}
