import type { Degree } from '$lib/types/degree'

export interface LocalizedCore {
	id: string
	deLabel: string
	enLabel: string
}

export interface POCore {
	id: string
	version: number
}

export interface StudyProgram extends LocalizedCore {
	po: POCore
	specialization?: LocalizedCore
	degree: Degree
	abbreviation: string
}
