import type { Person } from './core'
import type { Role } from './role'

export interface ApprovalStatus {
  id: 'approved' | 'rejected' | 'pending'
  deLabel: string
}

export interface Approval {
  id: string
  moduleDraft: string
  role: Role
  status: ApprovalStatus
  studyProgram: {
    id: string
    deLabel: string
  }
  comment: string
  respondedBy: Person
  respondedAt: string
}
