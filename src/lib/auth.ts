import type { Person } from './types/core'

export type UserInfo = {
  person: Person
  hasDirectorPrivileges: boolean
  hasModuleReviewPrivileges: boolean
  hasModulesToEdit: boolean
  rejectedReviews: number
  reviewsToApprove: number
  fastForwardApprovalPOs: string[] | undefined
}

export interface User {
  roles: string[]
  firstname: string
  lastname: string
  userInfo: UserInfo | undefined
}

export function isProfessor(user: User): boolean {
  return user.roles.includes('professor')
}
