let initData = ""
let urlAuth = ""

export function setupAuth(data: string, auth = ""): void {
  initData = data
  urlAuth = auth
}

export async function api(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (initData) headers["X-Telegram-Init-Data"] = initData
  if (urlAuth) headers["X-Auth-Token"] = urlAuth

  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    return (await res.json()) as Record<string, unknown>
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
