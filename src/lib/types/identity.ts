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
