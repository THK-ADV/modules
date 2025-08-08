import type { Degree, Person } from './core'
import type { Role } from './role'

export interface ReviewStatus {
  id: 'waiting_for_changes' | 'waiting_for_review'
  deLabel: string
  approved?: number
  needed?: number
}

export interface ReviewRequestItem {
  reviewId: string
  role: Role
  studyProgram: {
    id: string
    deLabel: string
  }
  degree: Degree
  canReview: boolean
}

export interface ReviewRequest {
  moduleId: string
  moduleTitle: string
  moduleAbbrev: string
  author: Person
  status: ReviewStatus
  items: ReviewRequestItem[]
}
