import { z } from 'zod/v4'

export const moduleDraftActionRequestSchema = z.object({
  action: z.enum(['delete', 'publish', 'requestReview', 'cancelReview', 'requestFastForwardReview'])
})

export type ModuleDraftTableAction = z.infer<typeof moduleDraftActionRequestSchema>['action']

export const moduleReviewActionRequestSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    comment: z.string().trim(),
    reviews: z.array(z.string().trim().min(1)).min(1)
  })
  .refine(({ action, comment }) => action !== 'reject' || comment.length >= 10, {
    message: 'Bei einer Ablehnung sind mindestens 10 Zeichen Kommentar erforderlich',
    path: ['comment']
  })
