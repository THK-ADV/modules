import { z } from 'zod/v4'
import { personSchema } from './core-data'

const labelSchema = z.object({ id: z.string(), deLabel: z.string() })

/** Review of `/moduleReviews/:moduleId`: one per study program and role of the module draft. */
export const approvalSchema = z.object({
  id: z.string(),
  moduleDraft: z.string(),
  role: labelSchema.extend({ id: z.enum(['pav', 'sgl']) }),
  status: labelSchema.extend({ id: z.enum(['approved', 'rejected', 'pending']) }),
  studyProgram: labelSchema,
  comment: z.string().nullable(),
  respondedBy: personSchema.nullable(), // null until a person responded
  respondedAt: z.string().nullable()
})

export type Approval = z.infer<typeof approvalSchema>
