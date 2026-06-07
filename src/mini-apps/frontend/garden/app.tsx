import { render } from "preact"
import { setupAuth } from "./api"
import { loadAll, timerTick } from "./state"
import { App } from "./components/App"

interface TgWebApp {
  initData: string
  ready: () => void
  expand: () => void
}

const tg = ((window as unknown as Record<string, { WebApp?: TgWebApp }>).Telegram?.WebApp) as TgWebApp | undefined

let initData = ""

if (tg) {
  tg.ready()
  tg.expand()
  initData = tg.initData || ""
}

if (!initData) {
  const match = window.location.hash.match(/[#&]tgWebAppData=([^&]+)/)
  if (match) {
    initData = decodeURIComponent(match[1] as string)
  }
}

const params = new URLSearchParams(window.location.search)
const urlAuth = params.get("auth") || ""

setupAuth(initData, urlAuth)

// Singleton timer tick
setInterval(() => { timerTick.value = Date.now() }, 1000)

loadAll()

render(<App />, document.getElementById("root")!)
