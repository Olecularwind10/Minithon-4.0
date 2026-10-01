import { apiRequest } from './apiClient'
import type { HelperProfile } from '../types/helper'
import type { RequestCategory } from '../types/request'

type ApiUser = {
  id: string
  name: string
  profile_image?: string
  latitude: number
  longitude: number
  area: string
  skills: string[]
  availability: Array<{ day?: string; start?: string; end?: string } | string>
  rating: number
  completed_requests: number
  community_verified: boolean | number
  status: string
}

const skillAliases: Record<string, HelperProfile['skills'][number]> = {
  'pet care': 'Pet Feeding',
  'pet sitting': 'Pet Sitting',
  'dog walking': 'Dog Walking',
  groceries: 'Grocery Pickup',
  'grocery pickup': 'Grocery Pickup',
  'moving help': 'Furniture Moving',
  'furniture moving': 'Furniture Moving',
  'laptop repair': 'Computer Help',
  'computer basics': 'Computer Help',
  errands: 'Errands',
}

function normalizeHelpers(user: ApiUser): HelperProfile {
  const skills = user.skills.map((skill) => skillAliases[skill.toLowerCase()]).filter(Boolean)
  const categories = Array.from(new Set(user.skills.map((skill) => {
    const value = skill.toLowerCase()
    if (value.includes('pet')) return 'Pet Care'
    if (value.includes('groc')) return 'Groceries'
    if (value.includes('mov') || value.includes('lift')) return 'Moving'
    if (value.includes('laptop') || value.includes('computer') || value.includes('wifi')) return 'Technical'
    if (value.includes('tutor')) return 'Tutoring'
    if (value.includes('errand')) return 'Elderly Care'
    return 'Other'
  }))) as RequestCategory[]
  const availability = user.availability.map((slot) => typeof slot === 'string' ? { day: slot, start: '09:00', end: '20:00' } : { day: slot.day || 'Any day', start: slot.start || '09:00', end: slot.end || '20:00' })
  return {
    userId: user.id,
    name: user.name,
    avatar: user.profile_image || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80',
    bio: 'A verified neighbor ready to lend a hand nearby.',
    skills,
    categories,
    availability,
    serviceRadiusKm: 5,
    ratingAverage: Number(user.rating || 0),
    ratingCount: Math.max(Number(user.completed_requests || 0), 1),
    completedHelps: Number(user.completed_requests || 0),
    verified: Boolean(user.community_verified),
    reliabilityScore: Number(user.completed_requests || 0) > 0 ? 0.85 : 0.5,
    active: user.status === 'active',
    latitude: user.latitude,
    longitude: user.longitude,
    locationLabel: user.area,
  }
}

export async function getHelpers(): Promise<HelperProfile[]> {
  const response = await apiRequest<{ users: ApiUser[] }>('/users')
  return response.users.map(normalizeHelpers)
}
