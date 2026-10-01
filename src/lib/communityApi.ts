import { readAuthToken } from './api'
import type { LocationCoordinates } from '../types/location'

export type ServiceCategory = 'plumber' | 'electrician' | 'carpenter' | 'tutor' | 'clinic' | 'pharmacy' | 'community_centre' | 'emergency_contact' | 'grocery' | 'repair' | 'other'

export type DirectoryService = {
  id: string
  name: string
  category: ServiceCategory
  description: string | null
  phone: string | null
  openingHours: string | null
  area: string
  lat: number | null
  lng: number | null
  distanceKm: number | null
  addedBy: { id: string; name: string | null }
  createdAt: string
  updatedAt: string
  canEdit: boolean
}

export type ServiceDraft = {
  name: string
  category: ServiceCategory
  description: string
  phone: string
  openingHours: string
  area: string
} & Partial<LocationCoordinates>

export type ActivityCategory = 'clean_up' | 'volunteering' | 'event' | 'workshop' | 'sports' | 'festival' | 'safety_drive' | 'other'
export type CommunityActivity = {
  id: string
  title: string
  description: string | null
  category: ActivityCategory
  area: string | null
  lat: number | null
  lng: number | null
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'removed'
  maxParticipants: number | null
  participantCount: number
  spotsLeft: number | null
  isFull: boolean
  joined: boolean
  isOrganizer: boolean
  organizer: { id: string; name: string | null; trustScore?: number; rating?: { average: number | null; count: number }; completedHelp?: number; verification?: { level: string }; badges?: string[] }
  distanceKm: number | null
  participants?: ActivityParticipant[]
}

export type ActivityParticipant = {
  userId: string
  name: string | null
  role: string
  status?: string
  joinedAt: string
  trustScore?: number | null
  rating?: { average: number | null; count: number } | null
  verification?: { level: string } | null
}

export type ActivityDraft = LocationCoordinates & {
  title: string
  description: string
  category: ActivityCategory
  area: string
  date: string
  time: string
  maxParticipants: number | null
}

export type CommunityTrust = {
  userId: string
  trustScore: number
  confidence: string
  breakdown: Record<string, number>
  rating: { average: number | null; count: number }
  completedHelp: number
  reliability: number
  communityActivity: { recentCount: number; windowDays: number }
  verification: { email: boolean; phone: boolean; level: string }
  badges: string[]
  reasons: string[]
  note: string
  user?: { id: string; name: string; memberSince: string }
}

export type CommunityReview = { id: string; rating: number; comment: string | null; createdAt: string; reviewer: string | null }
export type CommunityReport = {
  id: string
  reporter: { id: string; name: string | null }
  targetType: 'user' | 'request' | 'message' | 'activity' | 'service'
  targetId: string
  reason: string
  details: string | null
  evidence: Record<string, string> | null
  status: 'open' | 'reviewing' | 'dismissed' | 'actioned'
  resolution: string | null
  createdAt: string
  targetReportCount?: number
}
export type CommunityUser = {
  id: string
  name: string
  role: string
  status: string
  emailVerified: boolean
  phoneVerified: boolean
  openReports: number
  totalReports: number
  createdAt: string
}

async function communityRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  const token = readAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`/api/community-tools${path}`, { ...options, headers })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error || `Community request failed (${response.status})`)
  return result as T
}

const body = (value: unknown) => JSON.stringify(value)

export async function searchDirectory(filters: { q?: string; category?: string; lat?: number; lng?: number; radius?: number } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value))
  return communityRequest<{ items: DirectoryService[]; total: number }>(`/directory${params.size ? `?${params}` : ''}`)
}

export async function listDirectoryCategories() {
  const result = await communityRequest<{ items: Array<{ category: ServiceCategory; count: number }> }>('/directory/categories')
  return result.items
}

export async function getDirectoryService(id: string) {
  return communityRequest<DirectoryService>(`/directory/${encodeURIComponent(id)}`)
}

export async function createDirectoryService(service: ServiceDraft) {
  return communityRequest<DirectoryService>('/directory', { method: 'POST', body: body(service) })
}

export async function updateDirectoryService(id: string, service: Partial<ServiceDraft> & { baseUpdatedAt?: string }) {
  return communityRequest<DirectoryService>(`/directory/${encodeURIComponent(id)}`, { method: 'PUT', body: body(service) })
}

export async function reportDirectoryService(id: string, reason: string, details: string) {
  return communityRequest<{ id: string; status: string; duplicate: boolean }>(`/directory/${encodeURIComponent(id)}/report`, { method: 'POST', body: body({ reason, details }) })
}

export async function listActivities(filters: { q?: string; category?: string; status?: string; mine?: boolean; lat?: number; lng?: number; radius?: number } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, key === 'mine' ? (value ? '1' : '') : String(value))
  }
  return communityRequest<{ items: CommunityActivity[]; total: number }>(`/activities${params.size ? `?${params}` : ''}`)
}

export async function listActivityCategories() {
  const result = await communityRequest<{ items: ActivityCategory[] }>('/activities/categories')
  return result.items
}

export async function getActivity(id: string) {
  return communityRequest<CommunityActivity>(`/activities/${encodeURIComponent(id)}`)
}

export async function createActivity(activity: ActivityDraft) {
  return communityRequest<CommunityActivity>('/activities', { method: 'POST', body: body(activity) })
}

export async function updateActivity(id: string, activity: Partial<ActivityDraft>) {
  return communityRequest<CommunityActivity>(`/activities/${encodeURIComponent(id)}`, { method: 'PUT', body: body(activity) })
}

export async function joinActivity(id: string) {
  return communityRequest<{ joined: boolean; activity: CommunityActivity }>(`/activities/${encodeURIComponent(id)}/join`, { method: 'POST', body: body({}) })
}

export async function leaveActivity(id: string) {
  return communityRequest<{ joined: boolean; activity: CommunityActivity }>(`/activities/${encodeURIComponent(id)}/leave`, { method: 'POST', body: body({}) })
}

export async function setActivityStatus(id: string, status: string) {
  return communityRequest<CommunityActivity>(`/activities/${encodeURIComponent(id)}/status`, { method: 'POST', body: body({ status }) })
}

export async function getActivityParticipants(id: string) {
  return communityRequest<{ items: ActivityParticipant[]; joinedCount: number; maxParticipants: number | null }>(`/activities/${encodeURIComponent(id)}/participants`)
}

export async function removeActivityParticipant(id: string, userId: string) {
  return communityRequest<{ removed: boolean; userId: string }>(`/activities/${encodeURIComponent(id)}/participants/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}

export async function reportActivity(id: string, reason: string, details: string) {
  return communityRequest<{ id: string; status: string; duplicate: boolean }>(`/activities/${encodeURIComponent(id)}/report`, { method: 'POST', body: body({ reason, details }) })
}

export async function fetchCommunityTrust() {
  return communityRequest<CommunityTrust>('/trust/me')
}

export async function fetchCommunityTrustFor(userId: string) {
  return communityRequest<CommunityTrust>(`/trust/${encodeURIComponent(userId)}`)
}

export async function fetchCommunityReviews(userId: string) {
  return communityRequest<{ items: CommunityReview[]; distribution: Record<number, number> }>(`/trust/${encodeURIComponent(userId)}/reviews`)
}

export async function fetchCommunityHistory(userId: string) {
  return communityRequest<{ given: Array<{ id: string; title: string; category: string; completedAt: string | null }>; received: Array<{ id: string; title: string; category: string; completedAt: string | null }> }>(`/trust/${encodeURIComponent(userId)}/history`)
}

export async function createCommunityReport(input: { targetType: CommunityReport['targetType']; targetId: string; reason: string; details: string }) {
  return communityRequest<{ id: string; status: string; duplicate: boolean }>('/reports', { method: 'POST', body: body(input) })
}

export async function listMyReports() {
  const result = await communityRequest<{ items: CommunityReport[] }>('/reports/mine')
  return result.items
}

export async function listBlockedUsers() {
  return communityRequest<{ items: Array<{ userId: string; name: string | null; blockedAt: string }> }>('/blocks')
}

export async function searchCommunityPeople(query: string) {
  const params = new URLSearchParams({ q: query })
  return communityRequest<{ items: Array<{ id: string; name: string; area: string | null }> }>(`/people?${params}`)
}

export async function blockUser(userId: string) {
  return communityRequest<{ blocked: boolean; userId: string }>('/blocks', { method: 'POST', body: body({ userId }) })
}

export async function unblockUser(userId: string) {
  return communityRequest<{ blocked: boolean; userId: string }>(`/blocks/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}

export async function fetchAdminStats() {
  return communityRequest<{ openReports: number; reviewingReports: number; suspendedUsers: number; totalUsers: number }>('/admin/stats')
}

export async function listAdminReports(filters: { status?: string; targetType?: string } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  return communityRequest<{ items: CommunityReport[] }>(`/admin/reports${params.size ? `?${params}` : ''}`)
}

export async function reviewAdminReport(id: string, status: string, resolution: string) {
  return communityRequest<{ id: string; status: string }>(`/admin/reports/${encodeURIComponent(id)}`, { method: 'PUT', body: body({ status, resolution }) })
}

export async function removeAdminContent(targetType: string, targetId: string, note: string, reportId?: string) {
  return communityRequest<{ removed: boolean; targetType: string; targetId: string; reportsClosed: number }>('/admin/remove', { method: 'POST', body: body({ targetType, targetId, note, reportId }) })
}

export async function listAdminUsers(filters: { q?: string; reported?: boolean } = {}) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.reported) params.set('reported', '1')
  return communityRequest<{ items: CommunityUser[] }>(`/admin/users${params.size ? `?${params}` : ''}`)
}

export async function setAdminUserStatus(id: string, status: string, reason: string) {
  return communityRequest<{ id: string; status: string }>(`/admin/users/${encodeURIComponent(id)}/status`, { method: 'PUT', body: body({ status, reason }) })
}

export async function setAdminVerification(id: string, emailVerified: boolean, phoneVerified: boolean) {
  return communityRequest<{ id: string; emailVerified: boolean; phoneVerified: boolean }>(`/admin/users/${encodeURIComponent(id)}/verification`, { method: 'PUT', body: body({ emailVerified, phoneVerified }) })
}

export async function fetchModerationLog() {
  const result = await communityRequest<{ items: Array<{ id: string; adminId: string; action: string; targetType: string | null; targetId: string | null; note: string | null; createdAt: string }> }>('/admin/log')
  return result.items
}
