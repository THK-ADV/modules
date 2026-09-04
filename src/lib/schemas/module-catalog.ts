import { SEMESTER_PLAN_TYPES } from '$lib/types/schedule'
import { z } from 'zod/v4'

const nonEmptyStringSchema = z.string().trim().min(1)

export const moduleCatalogOptionsSchema = z.array(
  z.object({
    id: nonEmptyStringSchema,
    start: z.iso.date(),
    end: z.iso.date(),
    type: z.enum(SEMESTER_PLAN_TYPES),
    teachingUnit: nonEmptyStringSchema.nullable(),
    teachingUnitLabel: nonEmptyStringSchema.nullable(),
    semesterIndex: z.array(z.number().int()).nullable(),
    phase: z.string().nullable()
  })
)

export const moduleCatalogModuleOptionSchema = z.object({
  id: z.uuid(),
  title: nonEmptyStringSchema,
  abbrev: nonEmptyStringSchema,
  ects: z.number(),
  moduleType: nonEmptyStringSchema,
  recommendedSemesters: z.array(z.number().int()),
  recommendedSemestersPartTime: z.array(z.number().int()).default([]),
  mandatory: z.boolean(),
  optional: z.boolean(),
  specializations: z.array(nonEmptyStringSchema),
  defaultIncluded: z.boolean()
})

export const moduleCatalogElectiveOptionCandidateSchema = z.object({
  moduleId: z.uuid(),
  title: nonEmptyStringSchema,
  abbrev: nonEmptyStringSchema,
  ects: z.number()
})

export const moduleCatalogGenericElectiveGroupSchema = z.object({
  genericModuleId: z.uuid(),
  title: nonEmptyStringSchema,
  abbrev: nonEmptyStringSchema,
  optionCandidates: z.array(moduleCatalogElectiveOptionCandidateSchema)
})

export const moduleCatalogSpecializationOptionSchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema
})

export const moduleCatalogConfigOptionsSchema = z.object({
  modules: z.array(moduleCatalogModuleOptionSchema),
  genericElectiveGroups: z.array(moduleCatalogGenericElectiveGroupSchema),
  specializations: z.array(moduleCatalogSpecializationOptionSchema)
})

export type ModuleCatalogConfigOptions = z.infer<typeof moduleCatalogConfigOptionsSchema>
export type ModuleCatalogModuleOption = z.infer<typeof moduleCatalogModuleOptionSchema>
export type ModuleCatalogGenericElectiveGroup = z.infer<
  typeof moduleCatalogGenericElectiveGroupSchema
>

// Module type id the backend uses for generic (placeholder) modules
export const GENERIC_MODULE_TYPE = 'generic_module'

const genericModuleOccurrenceSchema = z.object({
  moduleId: z.uuid(),
  semester: z.number().int().min(1),
  count: z.number().int().min(1)
})

const moduleDistributionSchema = z.object({
  moduleId: z.uuid(),
  semesters: z
    .array(z.number().int().min(1))
    .min(2)
    .refine((semesters) => new Set(semesters).size === semesters.length)
})

// ModuleCatalogConfig: the user decision sent to preview/generate. Only deviations
// from the backend defaults are included; empty lists mean "use defaults".
export const moduleCatalogConfigSchema = z.object({
  moduleSelection: z.object({
    excludedModuleIds: z.array(z.uuid()),
    excludedElectiveOptions: z.array(
      z.object({
        genericModuleId: z.uuid(),
        optionModuleId: z.uuid()
      })
    )
  }),
  studyPlan: z.object({
    sections: z.array(
      z.object({
        untilSemester: z.number().int().min(1),
        headline: nonEmptyStringSchema
      })
    ),
    semesterSelections: z.array(
      z.object({
        moduleId: z.uuid(),
        selectedSemester: z.number().int().min(1)
      })
    ),
    genericModuleOccurrences: z.array(genericModuleOccurrenceSchema),
    alternative: z
      .object({
        genericModuleOccurrences: z.array(genericModuleOccurrenceSchema),
        moduleDistributions: z.array(moduleDistributionSchema).default([])
      })
      .default({ genericModuleOccurrences: [], moduleDistributions: [] })
  })
})

export type ModuleCatalogConfig = z.infer<typeof moduleCatalogConfigSchema>

export function createEmptyModuleCatalogConfig(): ModuleCatalogConfig {
  return {
    moduleSelection: {
      excludedModuleIds: [],
      excludedElectiveOptions: []
    },
    studyPlan: {
      sections: [],
      semesterSelections: [],
      genericModuleOccurrences: [],
      alternative: { genericModuleOccurrences: [], moduleDistributions: [] }
    }
  }
}
