import type { LocationCoordinates } from '../types/location'
import type { EnrichedHelpRequest, HelpRequest, RequestCategory, RequestUrgency } from '../types/request'
import { calculateDistance } from './distance'

export const RADIUS_OPTIONS = [1, 2, 5, 10] as const
export type RadiusKm = (typeof RADIUS_OPTIONS)[number]

export function enrichRequests<T extends HelpRequest>(requests: T[], userLocation: LocationCoordinates): Array<T & { distanceKm: number }> {
  return requests
    .map((request) => ({
      ...request,
      distanceKm: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        request.latitude,
        request.longitude,
      ),
    }))
    .sort((first, second) => first.distanceKm - second.distanceKm)
}

export function getNearbyRequests<T extends HelpRequest>(
  requests: T[],
  userLocation: LocationCoordinates,
  radiusKm: number,
): Array<T & { distanceKm: number }> {
  return enrichRequests(requests, userLocation).filter((request) => request.distanceKm <= radiusKm)
}

export function filterRequests<T extends EnrichedHelpRequest>(
  requests: T[],
  options: {
    category?: RequestCategory | 'All'
    urgency?: RequestUrgency | 'All'
    date?: 'Today' | 'Tomorrow' | 'All'
    query?: string
  },
): T[] {
  const query = options.query?.trim().toLowerCase() ?? ''
  return requests.filter((request) => {
    const matchesCategory = !options.category || options.category === 'All' || request.category === options.category
    const matchesUrgency = !options.urgency || options.urgency === 'All' || request.urgency === options.urgency
    const matchesDate = !options.date || options.date === 'All' || request.date === dateForFilter(options.date)
    const searchable = `${request.title} ${request.description} ${request.locationLabel} ${request.name}`.toLowerCase()
    return matchesCategory && matchesUrgency && matchesDate && searchable.includes(query)
  })
}

function dateForFilter(filter: 'Today' | 'Tomorrow') {
  const date = new Date()
  date.setDate(date.getDate() + (filter === 'Tomorrow' ? 1 : 0))
  return date.toISOString().slice(0, 10)
}

export function formatRequestDate(date: string, time: string) {
  const parsedDate = new Date(`${date}T${time}`)
  const day = parsedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const formattedTime = parsedDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  return `${day}, ${formattedTime}`
}
