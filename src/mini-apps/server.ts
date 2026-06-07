import { join, extname } from "node:path"
import { parseAuth, type InitData } from "./auth"
import { getDb } from "./db"
import { createGardenRouter } from "./api/garden"

const PORT = Number(process.env.MINI_APP_PORT)
const BOT_TOKEN = process.env.BOT_TOKEN ?? ""
const FRONTEND_DIR = join(import.meta.dir, "frontend")

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
}

interface RouteHandler {
  method: string
  path: string
  handler: (auth: InitData, body: unknown, params: Record<string, string>) => Response | Promise<Response>
}

const routes: RouteHandler[] = []

export function registerRoute(
  method: string,
  path: string,
  handler: RouteHandler["handler"],
): void {
  routes.push({ method: method.toUpperCase(), path, handler })
}

function matchRoute(
  method: string,
  pathname: string,
): { handler: RouteHandler["handler"]; params: Record<string, string> } | null {
  for (const r of routes) {
    if (r.method !== method) continue
    const paramNames: string[] = []
    const regexStr = r.path.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name)
      return "([^/]+)"
    })
    const regex = new RegExp(`^${regexStr}$`)
    const match = pathname.match(regex)
    if (match) {
      const params: Record<string, string> = {}
      for (let i = 0; i < paramNames.length; i++) {
        params[paramNames[i]!] = decodeURIComponent(match[i + 1]!)
      }
      return { handler: r.handler, params }
    }
  }
  return null
}

function authRequest(req: Request): InitData | null {
  const initData = req.headers.get("X-Telegram-Init-Data") || ""
  const urlToken = req.headers.get("X-Auth-Token") || ""
  return parseAuth(initData, urlToken, BOT_TOKEN)
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data, X-Auth-Token",
  }
}

function withCors(res: Response): Response {
  const headers = corsHeaders()
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v)
  }
  return res
}

function jsonResponse(data: unknown, status = 200): Response {
  return withCors(Response.json(data, { status }))
}

async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() })
  }

  const auth = authRequest(req)
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const matched = matchRoute(req.method, url.pathname)
  if (!matched) {
    return jsonResponse({ error: "Not Found" }, 404)
  }

  let body: unknown = null
  const hasBody = ["POST", "PUT", "PATCH"].includes(req.method)
  if (hasBody) {
    const ct = req.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      try {
        body = await req.json()
      } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400)
      }
    }
  }

  try {
    return withCors(await matched.handler(auth, body, matched.params))
  } catch (err) {
    console.error("[mini-apps] API error:", err)
    return jsonResponse({ error: "Internal Server Error" }, 500)
  }
}

async function handleStaticRequest(url: URL): Promise<Response> {
  const relative = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, "")
  const filePath = join(FRONTEND_DIR, "garden", relative)

  const f = Bun.file(filePath)
  const exists = await f.exists()
  if (exists) {
    const ext = extname(filePath)
    const mime = MIME_TYPES[ext] || "application/octet-stream"
    return new Response(f, {
      headers: { "Content-Type": mime, ...corsHeaders() },
    })
  }

  return Response.json({ error: "Not Found" }, { status: 404 })
}

let server: ReturnType<typeof Bun.serve> | null = null

export function startMiniAppServer(): void {
  if (server) return

  if (!PORT || Number.isNaN(PORT)) {
    console.warn("[mini-apps] MINI_APP_PORT not set, skipping server start")
    return
  }

  const url = process.env.MINI_APP_URL
  if (!url) {
    console.warn("[mini-apps] MINI_APP_URL not set, server started but bot command may not work")
  }

  getDb()
  createGardenRouter()

  server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url)

      if (url.pathname.startsWith("/api/")) {
        return handleApiRequest(req)
      }

      return handleStaticRequest(url)
    },
  })

  console.log(`[mini-apps] Server running on :${PORT}`)
}

export function stopMiniAppServer(): void {
  if (server) {
    server.stop()
    server = null
  }
}
