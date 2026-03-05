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

export type SemesterPlanType =
  | 'exam'
  | 'lecture'
  | 'block'
  | 'project'
  | 'closed_building'
  | 'self_study'

export type CourseType = 'lecture' | 'lab' | 'exercise' | 'seminar' | 'tutorial'

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

// used for the schedule calendar to show data
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
  teachingUnits: string[]
  props: { po: PO[] }
}

// used for the schedule entry dialog to edit data
export interface ScheduleEntryEdit {
  id: string
  module: string
  courseType: CourseType
  start: Date
  end: Date
  rooms: string[]
  props: { po: PO[] }
}

export type ScheduleEntryCreate = Omit<ScheduleEntryEdit, 'id'>

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
