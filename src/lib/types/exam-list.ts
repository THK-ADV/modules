import type { Semester } from './semester'
import type { StudyProgram } from './study-program'

export interface ExamList {
  studyProgram: StudyProgram
  semester: Semester
  date: string
  url: string
}
