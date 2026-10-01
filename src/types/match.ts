import type { EnrichedHelpRequest } from './request'
import type { HelperProfile } from './helper'

export type MatchReasons = {
  positive: string[]
  caveats: string[]
}

export type HelperMatch = {
  helper: HelperProfile
  request: EnrichedHelpRequest
  distanceKm: number
  score: number
  reasons: MatchReasons
  scores: {
    location: number
    category: number
    skill: number
    availability: number
    trust: number
    urgency: number
  }
}
