import { z } from 'zod/v4'
import { moduleRefSchema } from './exam-planning'

/** Exams of a live module, each with all its modules; `hasOwnExams: false` for child and generic modules. */
export const moduleExamsSchema = z.object({
  title: z.string(),
  hasOwnExams: z.boolean(),
  exams: z.array(z.object({ id: z.uuid(), name: z.string(), modules: z.array(moduleRefSchema) }))
})
