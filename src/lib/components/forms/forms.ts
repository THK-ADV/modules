import { fmtStudyProgram } from '$lib/formats'
import type { StudyProgram } from '$lib/types/study-program'

export function showPO(
  studyPrograms: StudyProgram[]
): (po: { po: string; specialization: string | null }) => string {
  return ({ po, specialization }) => {
    const sp = studyPrograms.find((sp) => {
      if (specialization != null) {
        return sp.po.id === po && sp.specialization?.id === specialization
      }
      return sp.po.id === po && sp.specialization == null
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

export function createSemesterOptions(count = 8) {
  return Array.from({ length: count }, (_, i) => ({
    id: (i + 1).toString(),
    label: `${i + 1}. Semester`
  }))
}
