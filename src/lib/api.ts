import type { LocationCoordinates } from '../types/location'

export type AuthUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  area?: string | null
  profile_image?: string | null
  skills: string[]
  availability: string[]
  rating: number
  completed_requests: number
  emailVerified: boolean
  phoneVerified: boolean
  communityVerified: boolean
  community_id?: string | null
  verification_status: string
}

export type AuthSession = { user: AuthUser; token: string }

export type BackendRequest = {
  id: string
  requester_id: string
  requester_name?: string
  requesterName?: string
  selected_helper_id: string | null
  title: string
  description: string
  category: string
  latitude: number
  longitude: number
  area: string
  preferred_date: string | null
  preferred_time: string | null
  urgency: string
  estimated_duration: number | null
  status: string
  created_at: string
  updated_at?: string
  responded_by_me?: boolean
  respondedByMe?: boolean
}

export type RequestDraft = LocationCoordinates & {
  title: string
  description: string
  category: string
  area: string
  preferredDate: string
  preferredTime: string
  urgency: string
}

export type RequestResponse = {
  id: string
  helper_id: string
  helper: {
    id: string
    name: string
    area: string
    rating: number
    communityVerified: boolean
  }
  reasons: string[]
  total_score: number
  created_at: string
}

export type HelpOffer = {
  id: string
  user_id: string
  category: string
  skills: string[]
  description: string
  latitude: number | null
  longitude: number | null
  service_radius: number
  availability: string[]
  status: string
  created_at: string
  updated_at: string
}

export type OfferDraft = LocationCoordinates & {
  category: string
  description: string
  skills: string[]
  serviceRadius: number
  availability: string[]
}

const TOKEN_KEY = 'neighborhood-help-token'
const USER_KEY = 'neighborhood-help-user'

export function readAuthToken() {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)
}

export function storeAuthSession(session: AuthSession) {
  localStorage.setItem(TOKEN_KEY, session.token)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function readAuthSession(): AuthSession | null {
  const token = readAuthToken()
  const user = typeof localStorage === 'undefined' ? null : localStorage.getItem(USER_KEY)
  if (!token || !user) return null
  try {
    return { token, user: JSON.parse(user) as AuthUser }
  } catch {
    clearAuthSession()
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = readAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`/api${path}`, { ...options, headers })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token) {
      clearAuthSession()
      window.dispatchEvent(new Event('neighborhood-auth-expired'))
    }
    throw new Error(payload?.error || `Request failed (${response.status})`)
  }
  return payload as T
}

function jsonBody(value: unknown) {
  return JSON.stringify(value)
}

export function registerAccount(input: { name: string; email: string; password: string; phone?: string; area?: string }) {
  return apiRequest<AuthSession & { message: string }>('/auth/register', { method: 'POST', body: jsonBody(input) })
}

export function loginAccount(input: { email: string; password: string }) {
  return apiRequest<AuthSession & { message: string }>('/auth/login', { method: 'POST', body: jsonBody(input) })
}

export function logoutAccount() {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST', body: jsonBody({}) })
}

export function fetchCurrentUser() {
  return apiRequest<{ user: AuthUser }>('/users/me')
}

export function updateCurrentUser(userId: string, updates: Partial<Pick<AuthUser, 'name' | 'phone' | 'area' | 'skills' | 'availability'>> & Partial<LocationCoordinates>) {
  return apiRequest<{ user: AuthUser }>(`/users/${encodeURIComponent(userId)}`, { method: 'PUT', body: jsonBody(updates) })
}

export function verifyEmail(userId: string, otp: string) {
  return apiRequest<{ message: string; user: AuthUser }>('/auth/verify-email', { method: 'POST', body: jsonBody({ userId, otp }) })
}

export function resendEmailCode(userId: string) {
  return apiRequest<{ message: string }>('/auth/resend-email-otp', { method: 'POST', body: jsonBody({ userId }) })
}

export function verifyCommunity(code: string) {
  return apiRequest<{ message: string; user: AuthUser }>('/verification/community', { method: 'POST', body: jsonBody({ code }) })
}

export async function fetchRequests() {
  const result = await apiRequest<{ requests: BackendRequest[] }>('/requests')
  return result.requests
}

export async function createRequest(request: RequestDraft) {
  const result = await apiRequest<{ request: BackendRequest }>('/requests', { method: 'POST', body: jsonBody(request) })
  return result.request
}

export async function respondToRequest(requestId: string) {
  return apiRequest<{ message: string; match: RequestResponse }>(`/requests/${encodeURIComponent(requestId)}/respond`, {
    method: 'POST',
    body: jsonBody({}),
  })
}

export async function fetchRequestResponses(requestId: string) {
  const result = await apiRequest<{ responses: RequestResponse[] }>(`/requests/${encodeURIComponent(requestId)}/responses`)
  return result.responses
}

export async function acceptRequestHelper(requestId: string, helperId: string) {
  const result = await apiRequest<{ request: BackendRequest }>(`/requests/${encodeURIComponent(requestId)}/accept`, {
    method: 'POST',
    body: jsonBody({ helperId }),
  })
  return result.request
}

export async function cancelRequest(requestId: string) {
  const result = await apiRequest<{ request: BackendRequest }>(`/requests/${encodeURIComponent(requestId)}/cancel`, {
    method: 'POST',
    body: jsonBody({}),
  })
  return result.request
}

export async function completeRequest(requestId: string) {
  const result = await apiRequest<{ request: BackendRequest }>(`/requests/${encodeURIComponent(requestId)}/complete`, {
    method: 'POST',
    body: jsonBody({}),
  })
  return result.request
}

export async function updateRequest(requestId: string, updates: Partial<RequestDraft>) {
  const result = await apiRequest<{ request: BackendRequest }>(`/requests/${encodeURIComponent(requestId)}`, {
    method: 'PUT',
    body: jsonBody(updates),
  })
  return result.request
}

export async function deleteRequest(requestId: string) {
  return apiRequest<{ success: boolean; id: string }>(`/requests/${encodeURIComponent(requestId)}`, { method: 'DELETE' })
}

export async function fetchOffers(userId: string) {
  const result = await apiRequest<{ offers: HelpOffer[] }>(`/offers?userId=${encodeURIComponent(userId)}`)
  return result.offers
}

export async function createOffer(offer: OfferDraft) {
  const result = await apiRequest<{ offer: HelpOffer }>('/offers', { method: 'POST', body: jsonBody(offer) })
  return result.offer
}

export async function updateOffer(offerId: string, updates: Partial<OfferDraft> & { status?: string }) {
  const result = await apiRequest<{ offer: HelpOffer }>(`/offers/${encodeURIComponent(offerId)}`, {
    method: 'PUT',
    body: jsonBody(updates),
  })
  return result.offer
}

export function deleteOffer(offerId: string) {
  return apiRequest<{ success: boolean; id: string }>(`/offers/${encodeURIComponent(offerId)}`, { method: 'DELETE' })
}