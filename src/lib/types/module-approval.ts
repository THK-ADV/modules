import type { Person } from './core'

export interface Role {
  id: 'pav' | 'sgl'
  deLabel: string
}

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
