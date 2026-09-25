import type { StudyProgram } from '../../types/study-program'
import type { StudyProgramFilterOption } from './types'
import { fmtStudyProgramName } from '$lib/formats'

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
    label: fmtStudyProgramName(program),
    studyProgram: program,
    searchKeywords: searchKeywordsFor(program)
  }
}
