import { toastMessage } from "../state"

const ICONS: Record<string, string> = {
  success: "✅",
  error: "❌",
}

export function Toast() {
  const msg = toastMessage.value
  if (!msg) return null

  return (
    <div className="toast-container">
      <div className={`toast ${msg.type}`}>
        <span className="toast-icon">{ICONS[msg.type] || "ℹ️"}</span>
        <span className="toast-text">{msg.text}</span>
      </div>
    </div>
  )
}
