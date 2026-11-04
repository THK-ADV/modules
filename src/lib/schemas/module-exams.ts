import { z } from 'zod/v4'

/** `null` selects the default exam named after the live module `title`, `[]` marks modules without own exams. */
export const moduleExamsSchema = z.object({
  title: z.string(),
  examNames: z.array(z.string()).nullable()
})

/** Validates trimmed names without changing the input while editing. */
const examNamesSchema = z
  .array(
    z
      .string()
      .refine((name) => name.trim().length > 0, 'Prüfungsnamen dürfen nicht leer sein.')
      .refine(
        (name) => !/[\r\n]/.test(name.trim()),
        'Prüfungsnamen dürfen keine Zeilenumbrüche enthalten.'
      )
  )
  .min(1, 'Mindestens ein Prüfungsname ist erforderlich.')
  .refine(
    (names) => new Set(names.map((name) => name.trim())).size === names.length,
    'Prüfungsnamen müssen eindeutig sein.'
  )
  .nullable()

/** Request and response of replacing the exam names of a live module. */
export const moduleExamsUpdateSchema = z.object({ examNames: examNamesSchema })
export type ModuleExamsUpdate = z.infer<typeof moduleExamsUpdateSchema>
