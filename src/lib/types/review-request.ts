import type { Degree, Person } from './core'
import type { Role } from './role'

export interface ModuleReviewJson {
  reviewId: string
  moduleId: string
  moduleTitle: string
  moduleAbbrev: string
  author: Person
  role: Role
  status: ModuleReviewStatus
  studyProgram: {
    id: string
    deLabel: string
  }
  degree: Degree
  canReview: boolean
}

export interface ModuleReviewStatus {
  id: 'waiting_for_changes' | 'waiting_for_review'
  deLabel: string
  approved?: number
  needed?: number
}

export interface ModuleReviewItem {
  reviewId: string
  role: Role
  studyProgram: {
    id: string
    deLabel: string
  }
  degree: Degree
  canReview: boolean
}

export interface ModuleReview {
  moduleId: string
  moduleTitle: string
  moduleAbbrev: string
  author: Person
  status: ModuleReviewStatus
  items: ModuleReviewItem[]
}
