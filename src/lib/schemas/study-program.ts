import type { StudyProgram } from '$lib/types/study-program'
import { z } from 'zod/v4'

const localizedSchema = z.object({ id: z.string(), deLabel: z.string(), enLabel: z.string() })

/** Study program view of `/studyPrograms`: one entry per PO, or per specialization if there is one. */
export const studyProgramSchema = localizedSchema.extend({
  abbreviation: z.string(),
  po: z.object({ id: z.string(), version: z.number().int() }),
  degree: localizedSchema.extend({ deDesc: z.string(), enDesc: z.string() }),
  specialization: localizedSchema.nullish().transform((value) => value ?? undefined)
}) satisfies z.ZodType<StudyProgram>
