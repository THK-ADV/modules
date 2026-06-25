import { PLAN_DRAFT_KINDS } from '$lib/types/plan-draft'
import { z } from 'zod/v4'

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

export const semesterResponseSchema = z.object({
  id: z.string().trim().min(1),
  year: z.number().int(),
  abbrev: z.string().trim().min(1),
  deLabel: z.string().trim().min(1),
  start: z.iso.date(),
  end: z.iso.date()
})

export const planDraftWithSemesterResponseSchema = z.object({
  planDraft: planDraftResponseSchema,
  semester: semesterResponseSchema
})
