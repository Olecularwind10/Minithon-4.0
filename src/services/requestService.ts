import { mockRequests } from '../data/mockRequests'
import type { HelpRequest } from '../types/request'

export async function getRequests(): Promise<HelpRequest[]> {
  return mockRequests
}
