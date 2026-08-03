// Helpers de fetch para el navegador. Lanzan Error con el mensaje del backend.

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (body as { error?: string }).error ?? 'Error en la petición'
    throw new Error(message)
  }
  return body as T
}

export async function apiGet<T>(url: string): Promise<T> {
  return handle<T>(await fetch(url, { cache: 'no-store' }))
}

export async function apiSend<T>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return handle<T>(res)
}
