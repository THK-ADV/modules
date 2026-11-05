import { MODULE_DRAFT_STATES } from '$lib/types/module-draft'
import { z } from 'zod/v4'
import { moduleShortResponseSchema } from './module-details'

const moduleDraftResponseSchema = z.object({
  module: moduleShortResponseSchema,
  isNewModule: z.boolean(), // true, if module is not merged into main yet (Neu Badge)
  isModuleManager: z.boolean(),
  ects: z.number(),
  status: z.string().nullable(), // e.g. 'active' or 'inactive'; null for new modules without draft data
  mandatoryPOs: z.array(z.string()).nullable(),
  optionalPOs: z.array(z.string()).nullable(),
  moduleDraftState: z.enum(MODULE_DRAFT_STATES),
  moduleDraft: z
    .object({
      id: z.string(),
      title: z.string(),
      abbreviation: z.string(),
      // modifiedKeys and keysToBeReviewed are comma separated list of keys that were modified
      modifiedKeys: z.string(),
      keysToBeReviewed: z.string()
    })
    .nullable()
})

export const moduleDraftsResponseSchema = z.object({
  direct: z.array(moduleDraftResponseSchema), // modules directly assigned to the user
  indirect: z.array(moduleDraftResponseSchema).optional(), // modules assigned through permissions granted to the user (e.g. admin, PAV, …)
  accreditationPOs: z.array(z.string()).optional() // POs which are currently in accreditation
})

export type ModuleDraftResponse = z.infer<typeof moduleDraftResponseSchema>
