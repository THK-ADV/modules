import { PLAN_DRAFT_KINDS } from '$lib/types/plan-draft'
import { z } from 'zod/v4'
import { semesterSchema } from './semester'

export const createPlanDraftInputSchema = z.object({
  kind: z.enum(PLAN_DRAFT_KINDS),
  semester: z.string().trim().min(1)
})

export const planDraftResponseSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.enum(PLAN_DRAFT_KINDS),
  semester: z.string().trim().min(1),
  createdAt: z.iso.datetime({ local: true }),
  updatedAt: z.iso.datetime({ local: true }),
  publishedAt: z.iso.datetime({ local: true }).nullable()
})

export const planDraftWithSemesterResponseSchema = z.object({
  planDraft: planDraftResponseSchema,
  semester: semesterSchema
})
