import type { Role } from './role'
import type { StudyProgram } from './study-program'

export interface StudyProgramPrivileges {
  studyProgram: StudyProgram
  roles: Role[]
}
