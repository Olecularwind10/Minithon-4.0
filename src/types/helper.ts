import type { RequestCategory } from './request'

export const SKILLS = [
  'Dog Walking',
  'Pet Sitting',
  'Pet Feeding',
  'Moving Boxes',
  'Furniture Moving',
  'Loading / Unloading',
  'Computer Help',
  'Phone Help',
  'Wi-Fi Setup',
  'Software Help',
  'Grocery Pickup',
  'Grocery Delivery',
  'Medicine Pickup',
  'Companion Help',
  'Errands',
  'Basic Assistance',
] as const

export type Skill = (typeof SKILLS)[number]

export type AvailabilitySlot = {
  day: string
  start: string
  end: string
}

export type HelperProfile = {
  userId: string
  name: string
  avatar: string
  bio: string
  skills: Skill[]
  categories: RequestCategory[]
  availability: AvailabilitySlot[]
  serviceRadiusKm: number
  ratingAverage: number
  ratingCount: number
  completedHelps: number
  verified: boolean
  reliabilityScore: number
  active: boolean
  latitude: number
  longitude: number
  locationLabel: string
}
