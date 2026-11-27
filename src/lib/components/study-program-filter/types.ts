import type { StudyProgram } from '../../schemas/study-program'

export interface StudyProgramFilterOption {
  id: string
  label: string
  studyProgram: StudyProgram
  searchKeywords: readonly string[]
}

export type StudyProgramFilterDisplayVariant = 2 | 5
