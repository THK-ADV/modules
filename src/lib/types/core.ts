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

// ModuleRelation

export interface Parent {
	kind: 'parent'
	children: string[]
}

export interface Child {
	kind: 'child'
	parent: string
}

export type ModuleRelation = Parent | Child
