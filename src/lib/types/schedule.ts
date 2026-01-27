import type { ModuleManagement } from './core'

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

export interface ScheduleEntry {
  id: string
  start: string
  end: string
  courseType: CourseType
  room: string
  roomAbbrev: string
  module: string
  moduleTitle: string
  moduleAbbrev: string
  moduleManagement: ModuleManagement[]
  teachingUnits: string[]
  props: { po: PO[] }
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
