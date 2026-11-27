import type { UserInfo } from './schemas/user-info'

export interface User {
  roles: string[]
  firstname: string
  lastname: string
  userInfo: UserInfo | undefined
}

export function isProfessor(user: User): boolean {
  return user.roles.includes('professor')
}

export function canSeeFacultyBookings(user: User | undefined): boolean {
  return user?.roles.includes('employee') ?? false
}
