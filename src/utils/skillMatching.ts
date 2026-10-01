import type { Skill } from '../types/helper'

export function calculateSkillScore(requiredSkills: Skill[], helperSkills: Skill[]) {
  if (requiredSkills.length === 0) return 0.5
  const matchingSkills = requiredSkills.filter((skill) => helperSkills.includes(skill)).length
  return matchingSkills / requiredSkills.length
}
