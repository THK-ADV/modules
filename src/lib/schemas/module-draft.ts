import { z } from 'zod/v4'
import { moduleShortResponseSchema } from './module-details'

const moduleDraftStateSchema = z.enum([
  'published',
  'valid_for_review',
  'valid_for_publication',
  'waiting_for_changes',
  'waiting_for_review',
  'waiting_for_publication',
  'unknown'
])

export type ModuleDraftState = z.infer<typeof moduleDraftStateSchema>

export const moduleDraftStateResponseSchema = z.object({ id: moduleDraftStateSchema })

const moduleDraftResponseSchema = z.object({
  module: moduleShortResponseSchema,
  isNewModule: z.boolean(), // true, if module is not merged into main yet (Neu Badge)
  isModuleManager: z.boolean(),
  ects: z.number(),
  status: z.string().nullable(), // e.g. 'active' or 'inactive'; null for new modules without draft data
  mandatoryPOs: z.array(z.string()).nullable(),
  optionalPOs: z.array(z.string()).nullable(),
  moduleDraftState: moduleDraftStateSchema,
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

export type ModuleDraft = ModuleDraftResponse & {
  isDirectlyAssigned: boolean // true if inherited or granted permission (Zugewiesenes Modul => default)
  isPartOfAccreditation: boolean // true if this module is associated to a new PO (Akkreditierungs Badge)
  isDerivedFromRole: boolean // true if this module is only associated via a permission or role (Gesonderte Rolle Badge)
  canBeFastForwardApproved: boolean // true if the user has fast forward approval permission for this particular module
}

export function canEdit(state: ModuleDraftState) {
  return (
    state === 'valid_for_review' ||
    state === 'valid_for_publication' ||
    state === 'published' ||
    state === 'waiting_for_changes'
  )
}

export function canPublish(state: ModuleDraftState) {
  return state === 'valid_for_publication'
}

export function canRequestReview(state: ModuleDraftState) {
  return state === 'valid_for_review'
}

export function canCancelReview(state: ModuleDraftState) {
  return state === 'waiting_for_review'
}

export function canDiscardChanges(state: ModuleDraftState) {
  return (
    state === 'valid_for_review' ||
    state === 'valid_for_publication' ||
    state === 'waiting_for_changes'
  )
}

const moduleDraftKeySchema = z.object({ id: z.string() })

/** Changed keys of `/moduleDrafts/:id/keys`; both lists are empty without a draft. */
export const moduleDraftKeysSchema = z.object({
  keysToBeReviewed: z.array(moduleDraftKeySchema),
  modifiedKeys: z.array(moduleDraftKeySchema)
})

export type ModuleDraftKeys = z.infer<typeof moduleDraftKeysSchema>
