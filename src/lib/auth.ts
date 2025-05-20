export type User = {
	firstname: string
	lastname: string
	roles: string[]
}

export function isEmployee(user: User): boolean {
	return user.roles.includes('employee')
}
