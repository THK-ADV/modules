import { z } from 'zod/v4'

/** Module attribute whose change requires a review. */
export const moduleReviewKeySchema = z.object({ id: z.string(), label: z.string() })

/** Review of `/moduleReviews`: one per module and study program to review. */
export const moduleReviewEntrySchema = z.object({
  reviewId: z.string(),
  moduleId: z.string(),
  moduleTitle: z.string(),
  moduleAbbrev: z.string(),
  author: z.object({ firstname: z.string(), lastname: z.string() }),
  role: z.object({ id: z.string(), deLabel: z.string() }),
  status: z.object({
    id: z.enum(['waiting_for_changes', 'waiting_for_review']),
    deLabel: z.string(),
    approved: z.number().optional(),
    needed: z.number().optional()
  }),
  studyProgram: z.object({ id: z.string(), deLabel: z.string() }),
  canReview: z.boolean()
})

export type ModuleReviewEntry = z.infer<typeof moduleReviewEntrySchema>

export type ModuleReviewKey = z.infer<typeof moduleReviewKeySchema>
export type ModuleReviewStatus = ModuleReviewEntry['status']
export type ModuleReviewItem = Pick<ModuleReviewEntry, 'reviewId' | 'studyProgram' | 'canReview'>
export type ModuleReview = Pick<
  ModuleReviewEntry,
  'moduleId' | 'moduleTitle' | 'moduleAbbrev' | 'author' | 'status'
> & { items: ModuleReviewItem[] }
