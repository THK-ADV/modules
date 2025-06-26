import type { Person } from './types/core'

export type UserInfo = {
  person: Person
  rejectedReviews: number
  hasModulesToEdit: boolean
  reviewsToApprove: number
  hasUniversityRole: boolean
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
