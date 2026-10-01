import { MATCHING_WEIGHTS, MAX_MATCH_RADIUS_KM } from '../config/matchingConfig'
import { getHelpers } from './helperService'
import type { HelperProfile } from '../types/helper'
import type { HelperMatch } from '../types/match'
import type { EnrichedHelpRequest, HelpRequest } from '../types/request'
import { availabilityScore } from '../utils/availability'
import { calculateDistance } from '../utils/distance'
import { calculateSkillScore } from '../utils/skillMatching'
import { calculateTrustScore } from '../utils/trust'

const urgencyScores = {
  Low: 0.4,
  Medium: 0.6,
  High: 0.8,
  Urgent: 1,
} as const

function scoreLocation(distanceKm: number, serviceRadiusKm: number) {
  return Math.max(0, 1 - distanceKm / Math.max(serviceRadiusKm, 1))
}

function matchHelperToRequest(request: HelpRequest | EnrichedHelpRequest, helper: HelperProfile): HelperMatch | null {
  const distanceKm = calculateDistance(request.latitude, request.longitude, helper.latitude, helper.longitude)
  const withinRadius = distanceKm <= Math.min(helper.serviceRadiusKm, MAX_MATCH_RADIUS_KM)
  if (!helper.active || !withinRadius) return null

  const categoryScore = helper.categories.includes(request.category) ? 1 : 0
  const skillScore = calculateSkillScore(request.requiredSkills, helper.skills)
  const availability = availabilityScore(request.date, request.time, helper.availability)
  if (availability === 0) return null

  const location = scoreLocation(distanceKm, helper.serviceRadiusKm)
  const trust = calculateTrustScore(helper)
  const urgency = urgencyScores[request.urgency]
  const score =
    MATCHING_WEIGHTS.location * location +
    MATCHING_WEIGHTS.skill * (skillScore * 0.75 + categoryScore * 0.25) +
    MATCHING_WEIGHTS.availability * availability +
    MATCHING_WEIGHTS.trust * trust +
    MATCHING_WEIGHTS.urgency * urgency

  const positive: string[] = [`${distanceKm.toFixed(1)} km away`]
  const caveats: string[] = []
  if (categoryScore) positive.push(`Matches ${request.category} category`)
  else caveats.push('Different category, but nearby')
  const matchingSkills = request.requiredSkills.filter((skill) => helper.skills.includes(skill))
  if (matchingSkills.length > 0) positive.push(`Matches ${matchingSkills.join(', ')} skill`)
  else if (request.requiredSkills.length > 0) caveats.push('Required skill not listed')
  if (availability === 1) positive.push('Available at requested time')
  else caveats.push('Available part of the requested day')
  if (helper.verified) positive.push('Verified neighbor')
  positive.push(`${helper.ratingAverage.toFixed(1)} star rating`)

  return {
    helper,
    request: {
      ...request,
      distanceKm: 'distanceKm' in request ? request.distanceKm : distanceKm,
    },
    distanceKm,
    score,
    reasons: { positive, caveats },
    scores: { location, category: categoryScore, skill: skillScore, availability, trust, urgency },
  }
}

export function getRecommendedHelpers(
  request: HelpRequest | EnrichedHelpRequest,
  helpers: HelperProfile[],
) {
  return helpers
    .map((helper) => matchHelperToRequest(request, helper))
    .filter((match): match is HelperMatch => match !== null)
    .sort((first, second) => second.score - first.score)
}

export async function getRecommendedHelpersForRequest(request: HelpRequest | EnrichedHelpRequest) {
  const helpers = await getHelpers()
  return getRecommendedHelpers(request, helpers)
}

export function getRecommendedRequests(
  helper: HelperProfile,
  requests: HelpRequest[],
) {
  return requests
    .filter((request) => request.status === 'Open')
    .map((request) => matchHelperToRequest(request, helper))
    .filter((match): match is HelperMatch => match !== null)
    .filter((match) => match.scores.category > 0 || match.scores.skill > 0)
    .sort((first, second) => second.score - first.score)
}

export { urgencyScores }
