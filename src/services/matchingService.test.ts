import { describe, expect, it } from 'vitest'
import type { HelperProfile } from '../types/helper'
import type { HelpRequest } from '../types/request'
import { calculateSkillScore } from '../utils/skillMatching'
import { availabilityScore } from '../utils/availability'
import { calculateTrustScore } from '../utils/trust'
import { getRecommendedHelpers } from './matchingService'

const petRequest: HelpRequest = {
  id: 'test-pet-request', title: 'Dog walk', description: 'Walk Milo', category: 'Pet Care', requiredSkills: ['Dog Walking'],
  latitude: 19.0607, longitude: 72.8362, urgency: 'Urgent', date: new Date().toISOString().slice(0, 10), time: '15:00', status: 'Open',
  name: 'Test requester', avatar: '', image: '', locationLabel: 'Matunga',
}

const fixtureHelpers: HelperProfile[] = [
  { userId: 'aisha', name: 'Aisha Khan', avatar: '', bio: '', skills: ['Dog Walking', 'Pet Sitting'], categories: ['Pet Care'], availability: [todaySlot()], serviceRadiusKm: 4, ratingAverage: 4.8, ratingCount: 18, completedHelps: 24, verified: true, reliabilityScore: 0.94, active: true, latitude: 19.0542, longitude: 72.8397, locationLabel: 'Dadar' },
  { userId: 'rahul', name: 'Rahul Sharma', avatar: '', bio: '', skills: ['Pet Feeding'], categories: ['Pet Care'], availability: [todaySlot('12:00', '20:00')], serviceRadiusKm: 5, ratingAverage: 4.6, ratingCount: 42, completedHelps: 58, verified: true, reliabilityScore: 0.91, active: true, latitude: 19.0312, longitude: 72.8474, locationLabel: 'Parel' },
  { userId: 'neha', name: 'Neha Patil', avatar: '', bio: '', skills: ['Computer Help'], categories: ['Technical'], availability: [todaySlot()], serviceRadiusKm: 3, ratingAverage: 4.9, ratingCount: 3, completedHelps: 7, verified: false, reliabilityScore: 0.76, active: true, latitude: 19.0612, longitude: 72.8368, locationLabel: 'Matunga' },
]

function todaySlot(start = '12:00', end = '20:00') {
  return { day: new Date().toLocaleDateString('en-US', { weekday: 'long' }), start, end }
}

describe('matching utilities', () => {
  it('calculates skill overlap as a transparent ratio', () => {
    expect(calculateSkillScore(['Dog Walking', 'Pet Sitting'], ['Dog Walking'])).toBe(0.5)
    expect(calculateSkillScore(['Dog Walking'], ['Dog Walking', 'Pet Sitting'])).toBe(1)
    expect(calculateSkillScore(['Dog Walking'], ['Computer Help'])).toBe(0)
  })

  it('scores full, partial, and unavailable time slots', () => {
    expect(availabilityScore(petRequest.date, '15:00', [todaySlot()])).toBe(1)
    expect(availabilityScore(petRequest.date, '09:00', [todaySlot()])).toBe(0.5)
    const otherDay = new Date()
    otherDay.setDate(otherDay.getDate() + 2)
    expect(availabilityScore(petRequest.date, '15:00', [{ day: otherDay.toLocaleDateString('en-US', { weekday: 'long' }), start: '12:00', end: '20:00' }])).toBe(0)
  })

  it('smooths trust so a single perfect rating does not dominate', () => {
    const oneRating = { ...fixtureHelpers[2], ratingAverage: 5, ratingCount: 1 }
    const established = { ...fixtureHelpers[1], ratingAverage: 4.8, ratingCount: 50 }
    expect(calculateTrustScore(established)).toBeGreaterThan(calculateTrustScore(oneRating))
  })
})

describe('helper recommendations', () => {
  it('ranks relevant helpers above a nearby unrelated helper and returns reasons', () => {
    const matches = getRecommendedHelpers(petRequest, fixtureHelpers)
    expect(matches[0].helper.name).toBe('Aisha Khan')
    expect(matches.find((match) => match.helper.name === 'Aisha Khan')?.reasons.positive).toContain('Matches Dog Walking skill')
    expect(matches.find((match) => match.helper.name === 'Neha Patil')?.scores.skill).toBe(0)
  })

  it('excludes inactive helpers and helpers outside their service radius', () => {
    const farHelper: HelperProfile = {
      ...fixtureHelpers[0],
      userId: 'far-helper',
      latitude: 20.5,
      longitude: 75.7,
      serviceRadiusKm: 1,
    }
    const inactiveHelper: HelperProfile = { ...fixtureHelpers[1], userId: 'inactive-helper', active: false }
    const matches = getRecommendedHelpers(petRequest, [farHelper, inactiveHelper])
    expect(matches).toHaveLength(0)
  })
})
