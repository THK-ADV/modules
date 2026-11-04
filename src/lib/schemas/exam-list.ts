import { z } from 'zod/v4'

/** Inclusive range whose bounds may be missing while the configuration is edited. */
const dateRangeSchema = z.object({
  start: z.iso.date().nullable(),
  end: z.iso.date().nullable()
})
export type DateRange = z.infer<typeof dateRangeSchema>

/** `exam: null` refers to the default exam named after the module. */
const examRefSchema = z.object({ module: z.uuid(), exam: z.string().nullable() })

const registrationOverrideSchema = examRefSchema
  .extend(dateRangeSchema.shape)
  .extend({ phase: z.string() })

export const examListConfigSchema = z.object({
  semester: z.string().regex(/^(sose|wise)_\d{4}$/),
  date: z.iso.date().nullable(),
  examPhases: z.array(z.string()),
  excludeGenericModules: z.boolean(),
  excludedModuleIds: z.array(z.uuid()),
  excludedExams: z.array(examRefSchema),
  registrationPeriods: z.record(z.string(), dateRangeSchema),
  registrationOverrides: z.array(registrationOverrideSchema)
})
export type ExamListConfig = z.infer<typeof examListConfigSchema>

const examListPOSchema = z.object({
  po: z.string(),
  specialization: z.string().nullable(),
  recommendedSemester: z.array(z.number().int()),
  mandatory: z.boolean(),
  instanceOf: z.uuid().nullable()
})

/**
 * `semester` is the smallest recommended semester, the maximum integer without any. `examNames: null` selects the
 * default exam, generic modules have `[]`.
 */
const examListModuleOptionSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  abbrev: z.string(),
  isGeneric: z.boolean(),
  mandatory: z.boolean(),
  semester: z.number().int(),
  po: z.array(examListPOSchema),
  assessmentMethods: z.array(z.object({ method: z.string(), percentage: z.number().nullable() })),
  firstExaminer: z.string(),
  secondExaminer: z.string(),
  examPhases: z.array(z.string()),
  examNames: z.array(z.string()).nullable()
})
export type ExamListModuleOption = z.infer<typeof examListModuleOptionSchema>

export const examListConfigOptionsSchema = z.object({
  modules: z.array(examListModuleOptionSchema)
})

/** Labels of the ids used by the options, from the public core data endpoints. */
export const examListLabelSchemas = {
  identities: z.array(
    z.union([
      z.object({
        id: z.string(),
        kind: z.literal('person'),
        firstname: z.string(),
        lastname: z.string()
      }),
      z.object({ id: z.string(), label: z.string() })
    ])
  ),
  assessmentMethods: z.array(z.object({ id: z.string(), deLabel: z.string() })),
  examPhases: z.array(z.object({ id: z.string(), label: z.string(), abbrev: z.string() }))
}
