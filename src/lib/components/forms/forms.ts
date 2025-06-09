import { fmtStudyProgram } from '$lib/formats'
import type { POMandatory } from '$lib/types/module-protocol'
import type { StudyProgram } from '$lib/types/study-program'

export function showPO(studyPrograms: StudyProgram[]): (po: POMandatory) => string {
  return ({ po, specialization }: POMandatory) => {
    const sp = studyPrograms.find((sp) => {
      if (specialization) {
        return sp.po.id === po && sp.specialization?.id === specialization
      }
      return sp.po.id === po && sp.specialization === null
    })
    return sp ? fmtStudyProgram(sp) : specialization || po
  }
}

export function showRecommendedSemester(semesters: number[]) {
  if (semesters.length === 0) return '-'
  return semesters
    .sort((a, b) => a - b)
    .map((s) => `${s}.`)
    .join(', ')
}

export function createSemesterOptions() {
  const MAX_SEMESTERS = 8
  return Array.from({ length: MAX_SEMESTERS }, (_, i) => ({
    id: (i + 1).toString(),
    label: `${i + 1}. Semester`
  }))
}
