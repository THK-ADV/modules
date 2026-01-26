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

export interface ScheduleEntry {
  id: string
  start: string
  end: string
  courseType: string
  room: string
  roomAbbrev: string
  module: string
  moduleTitle: string
  moduleAbbrev: string
  moduleManagement: ModuleManagement[]
  teachingUnits: string[]
}
