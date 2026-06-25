import type { Semester } from './semester'

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
