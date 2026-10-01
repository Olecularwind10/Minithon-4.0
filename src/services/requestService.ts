import { apiRequest } from './apiClient'
import { DEFAULT_REQUIRED_SKILLS } from '../types/requestSkills'
import type { HelpRequest } from '../types/request'

type ApiRequest = {
  id: string
  title: string
  description: string
  category: string
  latitude: number
  longitude: number
  area: string
  preferred_date: string
  preferred_time: string
  urgency: string
  status: string
  requester_name?: string
  profile_image?: string
}

function normalizeCategory(category: string): HelpRequest['category'] {
  const value = category.toLowerCase()
  if (value.includes('groc')) return 'Groceries'
  if (value.includes('mov')) return 'Moving'
  if (value.includes('tech') || value.includes('laptop')) return 'Technical'
  if (value.includes('pet')) return 'Pet Care'
  if (value.includes('elder') || value.includes('companion')) return 'Elderly Care'
  if (value.includes('tutor')) return 'Tutoring'
  if (value.includes('transport') || value.includes('vehicle')) return 'Transportation'
  if (value.includes('home') || value.includes('errand')) return 'Around Home'
  return 'Other'
}

function normalizeRequest(row: ApiRequest): HelpRequest {
  const category = normalizeCategory(row.category)
  const urgency = row.urgency.toLowerCase()
  const status = row.status.toLowerCase().replace('_', ' ').split(' ').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ')
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category,
    requiredSkills: DEFAULT_REQUIRED_SKILLS[category],
    latitude: row.latitude,
    longitude: row.longitude,
    urgency: (urgency === 'urgent' ? 'Urgent' : `${urgency.charAt(0).toUpperCase()}${urgency.slice(1)}`) as HelpRequest['urgency'],
    date: row.preferred_date,
    time: row.preferred_time,
    status: status as HelpRequest['status'],
    name: row.requester_name || 'Neighborhood member',
    avatar: row.profile_image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    image: '',
    locationLabel: row.area,
  }
}

export async function getRequests(): Promise<HelpRequest[]> {
  const response = await apiRequest<{ requests: ApiRequest[] }>('/requests?status=open')
  return response.requests.map(normalizeRequest)
}

export async function createRequest(request: HelpRequest): Promise<HelpRequest> {
  const response = await apiRequest<{ request: ApiRequest }>('/requests', {
    method: 'POST',
    body: JSON.stringify({
      title: request.title,
      description: request.description,
      category: request.category,
      latitude: request.latitude,
      longitude: request.longitude,
      area: request.locationLabel,
      preferredDate: request.date,
      preferredTime: request.time,
      urgency: request.urgency.toLowerCase(),
    }),
  })
  return normalizeRequest(response.request)
}
