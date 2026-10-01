import type { RequestCategory } from './request'
import type { Skill } from './helper'

export const DEFAULT_REQUIRED_SKILLS: Record<RequestCategory, Skill[]> = {
  Groceries: ['Grocery Pickup'],
  Moving: ['Furniture Moving'],
  Technical: ['Computer Help'],
  'Pet Care': ['Dog Walking'],
  'Elderly Care': ['Companion Help'],
  Tutoring: [],
  Transportation: [],
  'Around Home': [],
  Other: [],
}
