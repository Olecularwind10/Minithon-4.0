const API_USER_ID = import.meta.env.VITE_API_USER_ID || 'u_asha'

export type HelpRequestRecord = {
  id: string
  title: string
  description: string
  category: string
  area: string
  date: string | null
  time: string | null
  latitude: number | null
  longitude: number | null
  urgency: string
  status: string
  createdAt: string
  requester: { id: string; name: string }
  isMine: boolean
  offeredByMe: boolean
}

export type RequestDraft = {
  title: string
  description: string
  category: string
  area: string
  date: string
  time: string
  latitude: number
  longitude: number
  urgency: string
}

export type TrustProfile = {
  user: { id: string; name: string; memberSince: string }
  trustScore: number
  rating: { average: number | null; count: number }
  completedHelp: number
  communityActivity: { recentCount: number; windowDays: number }
  verification: { email: boolean; phone: boolean; level: string }
  badges: string[]
}

export type HelpHistoryItem = {
  id: string
  title: string
  category: string
  completedAt: string | null
}

export type ProfileBundle = {
  trust: TrustProfile
  history: { given: HelpHistoryItem[]; received: HelpHistoryItem[] }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'x-user-id': API_USER_ID,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error || `API request failed (${response.status})`)
  }
  return payload as T
}

export async function fetchHelpRequests() {
  return apiRequest<{ items: HelpRequestRecord[]; total: number }>('/requests')
}

export function createHelpRequest(request: RequestDraft) {
  return apiRequest<HelpRequestRecord>('/requests', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function offerHelp(requestId: string) {
  return apiRequest<HelpRequestRecord>(`/requests/${encodeURIComponent(requestId)}/offer`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function fetchProfile() {
  const [trust, history] = await Promise.all([
    apiRequest<TrustProfile>('/trust/me'),
    apiRequest<ProfileBundle['history']>(`/trust/${encodeURIComponent(API_USER_ID)}/history`),
  ])
  const user = await apiRequest<{ user: TrustProfile['user'] }>(`/trust/${encodeURIComponent(API_USER_ID)}`)
  return { trust: { ...trust, user: user.user }, history } satisfies ProfileBundle
}