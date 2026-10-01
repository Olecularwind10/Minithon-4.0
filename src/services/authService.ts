const SESSION_TOKEN_KEY = 'neighborly.session.token'

export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  area: string | null
  skills: string[]
  availability: string[]
  rating: number
  completed_requests: number
  emailVerified: boolean
  phoneVerified: boolean
  communityVerified: boolean
  verification_status: string
}

export type RegistrationDetails = {
  name: string
  email: string
  phone: string
  address: string
  area: string
  password: string
  skills: string[]
  availability: string[]
}

export type RegistrationResult = {
  user: AuthUser
  token: string
}

class AuthApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...init, headers })
  } catch {
    throw new Error('Cannot reach the Neighborly server. Start the backend with npm run backend:dev.')
  }

  const payload = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) {
    throw new AuthApiError(payload.error || 'Authentication failed. Please try again.', response.status)
  }
  return payload as T
}

function readSessionToken() {
  return window.localStorage.getItem(SESSION_TOKEN_KEY)
}

function saveSessionToken(token: string) {
  window.localStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_TOKEN_KEY)
}

async function fetchCurrentUser(token: string) {
  const result = await request<{ user: AuthUser }>('/auth/me', {}, token)
  return result.user
}

export async function restoreSession(): Promise<AuthUser | null> {
  const token = readSessionToken()
  if (!token) return null

  try {
    return await fetchCurrentUser(token)
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) {
      clearSession()
      return null
    }
    throw error
  }
}

export async function loginUser(email: string, password: string) {
  const result = await request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  saveSessionToken(result.token)

  try {
    return await fetchCurrentUser(result.token)
  } catch (error) {
    clearSession()
    throw error
  }
}

export async function registerUser(details: RegistrationDetails): Promise<RegistrationResult> {
  return request<RegistrationResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: details.name,
      email: details.email,
      phone: details.phone,
      address: details.address,
      area: details.area,
      password: details.password,
      skills: details.skills,
      availability: details.availability,
    }),
  })
}

export async function verifyRegistrationEmail(userId: string, otp: string, token: string) {
  await request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ userId, otp }),
  })
  saveSessionToken(token)

  try {
    return await fetchCurrentUser(token)
  } catch (error) {
    clearSession()
    throw error
  }
}

export async function resendRegistrationCode(userId: string) {
  await request('/auth/resend-email-otp', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

export async function logoutUser() {
  const token = readSessionToken()
  try {
    if (token) await request('/auth/logout', { method: 'POST' }, token)
  } finally {
    clearSession()
  }
}