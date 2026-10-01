import type { AvailabilitySlot } from '../types/helper'

export function availabilityScore(
  date: string,
  time: string,
  availability: AvailabilitySlot[],
) {
  const requestedDay = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
  const matchingDay = availability.filter((slot) => slot.day === requestedDay)
  if (matchingDay.some((slot) => slot.start <= time && time <= slot.end)) return 1
  if (matchingDay.length > 0) return 0.5
  return 0
}
