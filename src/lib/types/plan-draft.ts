import type { CourseType, ModuleManagement, PO } from './schedule'
import type { Semester } from './semester'

/** For displaying in the calendar view */
export interface ScheduleEntryDraft {
  id: string
  planDraft: string
  seriesId: string
  start: string
  end: string
  courseType: CourseType
  rooms: { id: string; abbrev: string }[]
  module: string
  moduleTitle: string
  moduleAbbrev: string
  moduleManagement: ModuleManagement[]
  lecturer: ModuleManagement[]
  teachingUnits: string[]
  po: PO[]
}

/** For creating/updating */
export interface ScheduleEntryDraftPayload {
  planDraft: string
  seriesId: string
  module: string
  courseType: CourseType
  start: string
  end: string
  rooms: string[]
  lecturer: string[]
  po: PO[]
}

export type PlanDraftKind = 'schedule' | 'exam'

export interface PlanDraft {
  id: string
  kind: PlanDraftKind
  semester: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface PlanDraftCreate {
  kind: PlanDraftKind
  semester: string
}

export interface PlanDraftView extends PlanDraft {
  semesterLabel: string
  updatedAtLabel: string
}

export function createPlanDraftViews(drafts: PlanDraft[], semesters: Semester[]): PlanDraftView[] {
  const dateFormatter = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  return drafts.map((draft) => {
    const match = semesters.find((semester) => semester.id === draft.semester)
    let semesterLabel
    if (match) {
      semesterLabel = `${match.deLabel} ${match.year}`
    } else {
      semesterLabel = draft.semester
    }
    const updatedAtLabel = dateFormatter.format(new Date(draft.updatedAt))
    return { ...draft, semesterLabel, updatedAtLabel }
  })
}
