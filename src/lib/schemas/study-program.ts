import { z } from 'zod/v4'

const localizedSchema = z.object({ id: z.string(), deLabel: z.string(), enLabel: z.string() })

/** Study program view of `/studyPrograms`: one entry per PO, or per specialization if there is one. */
export const studyProgramSchema = localizedSchema.extend({
  abbreviation: z.string(),
  po: z.object({ id: z.string(), version: z.number().int() }),
  degree: localizedSchema.extend({ deDesc: z.string(), enDesc: z.string() }),
  specialization: localizedSchema.nullish().transform((value) => value ?? undefined)
})

export type StudyProgram = z.infer<typeof studyProgramSchema>

export function getFullPOId({ specialization, po }: StudyProgram): string {
  return specialization?.id ?? po.id
}

/** ECTS factor of a PO of `/pos`. */
export const poEctsFactorSchema = z.object({ ectsFactor: z.number() })
