export const REQUEST_CATEGORIES = [
  'Groceries',
  'Moving',
  'Technical',
  'Pet Care',
  'Elderly Care',
  'Tutoring',
  'Transportation',
  'Around Home',
  'Other',
] as const

export type RequestCategory = (typeof REQUEST_CATEGORIES)[number]
export type RequestUrgency = 'Low' | 'Medium' | 'High' | 'Urgent'
export type RequestStatus = 'Open' | 'Responses' | 'In Progress' | 'Completed' | 'Cancelled'

export type HelpRequest = {
  id: string
  title: string
  description: string
  category: RequestCategory
  latitude: number
  longitude: number
  urgency: RequestUrgency
  date: string
  time: string
  status: RequestStatus
  name: string
  avatar: string
  image: string
  locationLabel: string
}

export type EnrichedHelpRequest = HelpRequest & {
  distanceKm: number
}
