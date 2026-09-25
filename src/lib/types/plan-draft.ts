import type { Semester } from '$lib/schemas/semester'
import { fmtDateTime, fmtSemester } from '$lib/formats'

export const PLAN_DRAFT_KINDS = ['schedule', 'exam'] as const

export type PlanDraftKind = (typeof PLAN_DRAFT_KINDS)[number]

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
  return drafts.map((draft) => {
    const match = semesters.find((semester) => semester.id === draft.semester)
    let semesterLabel
    if (match) {
      semesterLabel = fmtSemester(match)
    } else {
      semesterLabel = draft.semester
    }
    const updatedAtLabel = fmtDateTime(draft.updatedAt)
    return { ...draft, semesterLabel, updatedAtLabel }
  })
}
