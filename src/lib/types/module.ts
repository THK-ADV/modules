import type { StudyProgram } from '$lib/types/study-program'

export type IdentityKind = 'person' | 'group' | 'unknown'

export interface PersonShort {
  id: string
  abbrev: string
  kind: IdentityKind
  title: string
  firstname: string
  lastname: string
}

export interface StudyProgramModuleAssociation {
  studyProgram: StudyProgram
  mandatory: boolean
  recommendedSemester: number[]
}

export interface ModuleViewJson {
  id: string
  title: string
  abbrev: string
  ects: number
  status: string
  moduleManagement: PersonShort[]
  studyProgram: StudyProgramModuleAssociation[]
}

export interface ModuleType {
  id: 'pm' | 'wm' | 'pwm'
  label: string
  abbrev: string
}

export interface ModuleView extends ModuleViewJson {
  moduleType: ModuleType | undefined
}
