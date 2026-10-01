const API_ROOT = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'neighborhood-help-token'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `API request failed (${response.status})`)
  return body as T
}

async function ensureDevelopmentSession() {
  if (localStorage.getItem(TOKEN_KEY)) return

  const response = await fetch(`${API_ROOT}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'seeker1@powai.local', password: 'Password123!' }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Unable to establish a development session.')
  localStorage.setItem(TOKEN_KEY, body.token)
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  await ensureDevelopmentSession()
  return request<T>(path, options)
}
