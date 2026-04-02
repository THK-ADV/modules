import type { StudyProgram } from '../../types/study-program'
import type { StudyProgramFilterOption } from './types'

function searchKeywordsFor(sp: StudyProgram): string[] {
  const parts = [sp.deLabel, sp.abbreviation, sp.degree.deLabel, String(sp.po.version)]
  if (sp.specialization) {
    parts.push(sp.specialization.deLabel)
  }
  return parts
}

export function toStudyProgramFilterOptions(programs: StudyProgram[]): StudyProgramFilterOption[] {
  return programs.map((sp) => ({
    id: sp.specialization?.id ?? sp.po.id,
    label: sp.specialization ? `${sp.deLabel} ${sp.specialization.deLabel}` : sp.deLabel,
    studyProgram: sp,
    searchKeywords: searchKeywordsFor(sp)
  }))
}
