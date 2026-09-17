import type { IdentityKind } from './module'

export interface TeachingUnit {
  id: string
  label: string
}

export interface SemesterPlanEntry {
  id: string
  start: string
  end: string
  type: SemesterPlanType
  teachingUnit: string | null
  teachingUnitLabel: string | null
  semesterIndex: number[] | null
  phase: string | null
}

export const SEMESTER_PLAN_TYPES = [
  'exam',
  'lecture',
  'block',
  'project',
  'closed_building',
  'self_study',
  'semester_break'
] as const

export type SemesterPlanType = (typeof SEMESTER_PLAN_TYPES)[number]

export const COURSE_TYPES = ['lecture', 'lab', 'exercise', 'seminar', 'tutorial'] as const

export type CourseType = (typeof COURSE_TYPES)[number]

export interface PO {
  po: string
  specialization: string | null
  recommendedSemester: number[]
  mandatory: boolean
}

export function clonePOs(pos: PO[]): PO[] {
  return pos.map((po) => ({
    ...po,
    recommendedSemester: [...po.recommendedSemester]
  }))
}

/**
 * Collapses PO entries that share study program, PO, specialization and mandatory flag into a
 * single entry with the union of their recommended semesters. The backend reports one entry per
 * generic module option, so a module chosen by several generic modules of the same PO arrives
 * multiple times.
 */
export function mergePOs(pos: PO[]): PO[] {
  const merged: PO[] = []
  for (const { po, specialization, mandatory, recommendedSemester } of pos) {
    let entry = merged.find(
      (m) => m.po === po && m.specialization === specialization && m.mandatory === mandatory
    )
    if (!entry) {
      entry = { po, specialization, mandatory, recommendedSemester: [] }
      merged.push(entry)
    }
    for (const semester of recommendedSemester) {
      // 0 carries no recommendation and cannot be selected in the picker
      if (semester > 0 && !entry.recommendedSemester.includes(semester)) {
        entry.recommendedSemester.push(semester)
      }
    }
  }
  for (const entry of merged) {
    entry.recommendedSemester.sort((a, b) => a - b)
  }
  return merged
}

export function arraysEqual(lhs: string[], rhs: string[]): boolean {
  if (lhs.length !== rhs.length) return false
  const sortedA = [...lhs].sort()
  const sortedB = [...rhs].sort()
  return sortedA.every((val, index) => val === sortedB[index])
}

export function posEqual(lhs: PO[], rhs: PO[]): boolean {
  function poKey({ po, specialization, mandatory }: PO): string {
    return `${specialization ?? po}-${mandatory}`
  }

  if (lhs.length !== rhs.length) return false
  const sortL = [...lhs].sort((a, b) => poKey(a).localeCompare(poKey(b)))
  const sortR = [...rhs].sort((a, b) => poKey(a).localeCompare(poKey(b)))
  return sortL.every((l, i) => {
    const r = sortR[i]
    const semestersL = [...l.recommendedSemester].sort((a, b) => a - b)
    const semestersR = [...r.recommendedSemester].sort((a, b) => a - b)
    return (
      l.po === r.po &&
      l.specialization === r.specialization &&
      l.mandatory === r.mandatory &&
      semestersL.length === semestersR.length &&
      semestersL.every((v, j) => v === semestersR[j])
    )
  })
}

export interface ModuleManagement {
  id: string
  kind: IdentityKind
  label: string
  abbreviation: string
}

export function fmtCourseType(courseType: CourseType): string {
  switch (courseType) {
    case 'lecture':
      return 'Vorlesung'
    case 'lab':
      return 'Praktikum'
    case 'exercise':
      return 'Übung'
    case 'seminar':
      return 'Seminar'
    case 'tutorial':
      return 'Tutorium'
  }
}

/**
 * Shared frontend read model for live schedule entries and schedule plan draft entries.
 * A draft's plan draft ID remains server-side context and is intentionally not part of this model.
 */
export interface ScheduleEntry {
  id: string
  start: Date
  end: Date
  courseType: CourseType
  rooms: { id: string; abbrev: string }[]
  module: string
  moduleTitle: string
  moduleAbbrev: string
  moduleManagement: ModuleManagement[]
  lecturer: ModuleManagement[]
  teachingUnits: string[]
  po: PO[]
  seriesId: string
}

// Note(BK2F6A): Write models are a twin of Note(BK2F6A) teaching BookingCreate/Edit
// in types/booking.ts. Keep module/courseType/rooms/po/lecturer/series/date
// fields in sync.
/** Shared frontend edit model for live schedule entries and schedule plan draft entries. */
export interface ScheduleEntryEdit {
  id: string
  module: string
  courseType: CourseType
  start: Date
  end: Date
  rooms: string[]
  po: PO[]
  lecturer: string[]
  seriesId: string
}

/** Shared frontend create model for live schedule entries and schedule plan draft entries. */
export type ScheduleEntryCreate = Omit<ScheduleEntryEdit, 'id'>

export type ScheduleEntryUpdateScope = 'single' | 'series'

export interface SeriesOccurrence {
  id: string
  start: Date
  end: Date
}

export interface ModuleCore {
  id: string
  title: string
  abbrev: string
}

export interface Room {
  id: string
  label: string
  abbrev: string
}
