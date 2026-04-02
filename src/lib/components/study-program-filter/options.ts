import type { StudyProgram } from '../../types/study-program'
import type { StudyProgramFilterOption } from './types'

function searchKeywordsFor(sp: StudyProgram): string[] {
  const parts = [sp.deLabel, sp.abbreviation, sp.degree.deLabel, String(sp.po.version)]
  if (sp.specialization) {
    parts.push(sp.specialization.deLabel)
  }
  return parts
}

export function toStudyProgramFilterOption(program: StudyProgram): StudyProgramFilterOption {
  return {
    id: program.specialization?.id ?? program.po.id,
    label: program.specialization
      ? `${program.deLabel} ${program.specialization.deLabel}`
      : program.deLabel,
    studyProgram: program,
    searchKeywords: searchKeywordsFor(program)
  }
}
