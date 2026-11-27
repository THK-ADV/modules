import { fmtDateTime, fmtSemester } from '$lib/formats'
import { z } from 'zod/v4'
import { semesterSchema, type Semester } from './semester'

export const createPlanDraftInputSchema = z.object({
  semester: z.string().trim().min(1)
})

export const planDraftResponseSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.enum(['schedule', 'exam']),
  semester: z.string().trim().min(1),
  createdAt: z.iso.datetime({ local: true }),
  updatedAt: z.iso.datetime({ local: true }),
  publishedAt: z.iso.datetime({ local: true }).nullable()
})

export const planDraftWithSemesterResponseSchema = z.object({
  planDraft: planDraftResponseSchema,
  semester: semesterSchema
})

export type PlanDraft = z.infer<typeof planDraftResponseSchema>

export function createPlanDraftViews(drafts: PlanDraft[], semesters: Semester[]) {
  return drafts.map((draft) => {
    const match = semesters.find((semester) => semester.id === draft.semester)
    const semesterLabel = match ? fmtSemester(match) : draft.semester
    return { ...draft, semesterLabel, updatedAtLabel: fmtDateTime(draft.updatedAt) }
  })
}
