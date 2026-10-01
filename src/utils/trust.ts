import type { HelperProfile } from '../types/helper'

export function calculateTrustScore(helper: HelperProfile) {
  const priorRating = 4.2
  const priorCount = 20
  const smoothedRating = (helper.ratingAverage * helper.ratingCount + priorRating * priorCount) / (helper.ratingCount + priorCount)
  const ratingScore = smoothedRating / 5
  const completionScore = Math.min(helper.completedHelps / 50, 1)
  const verificationScore = helper.verified ? 1 : 0.45
  return ratingScore * 0.55 + completionScore * 0.2 + verificationScore * 0.1 + helper.reliabilityScore * 0.15
}
