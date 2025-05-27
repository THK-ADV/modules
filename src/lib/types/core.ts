// Identity

export interface Person {
	id: string
	lastname: string
	firstname: string
	title: string
	abbreviation: string
	kind: 'person'
}

export interface UnknownIdentity {
	id: string
	label: string
	kind: 'unknown'
}

export interface Group {
	id: string
	label: string
	kind: 'group'
}

export type Identity = Person | UnknownIdentity | Group

// Degree

export interface Degree {
	id: string
	deLabel: string
	enLabel: string
	deDesc: string
	enDesc: string
}

// Participants

export interface Participants {
	min: number
	max: number
}

// Workload

export interface Workload {
	lecture: number
	seminar: number
	practical: number
	exercise: number
	projectSupervision: number
	projectWork: number
	selfStudy: number
	total: number
}

export interface ModuleType {
	id: string
	deLabel: string
}
