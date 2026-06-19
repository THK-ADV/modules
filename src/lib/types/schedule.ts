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
