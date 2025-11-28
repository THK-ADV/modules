import type { ModuleShort } from './module-details'

export type ModuleDraftState =
  | 'published'
  | 'valid_for_review'
  | 'valid_for_publication'
  | 'waiting_for_changes'
  | 'waiting_for_review'
  | 'waiting_for_publication'
  | 'unknown'

export interface ModuleDraft {
  module: ModuleShort
  isNewModule: boolean // true, if module is not merged into main yet (Neu Badge)
  isModuleManager: boolean
  isDirectlyAssigned: boolean // true if inherited or granted permission (Zugewiesenes Modul => default)
  isPartOfAccreditation: boolean // true if this module is associated to a new PO (Akkreditierungs Badge)
  isDerivedFromRole: boolean // true if this module is only associated via a permission or role (Gesonderte Rolle Badge)
  canBeFastForwardApproved: boolean // true if the user has fast forward approval permission for this particular module
  ects: number
  mandatoryPOs: string[] | null
  optionalPOs: string[] | null
  moduleDraftState: ModuleDraftState
  moduleDraft: {
    id: string
    title: string
    abbreviation: string
    // modifiedKeys and keysToBeReviewed are comma separated list of keys that were modified
    modifiedKeys: string
    keysToBeReviewed: string
  } | null
}

export interface ModuleDrafts {
  direct: ModuleDraft[] // modules directly assigned to the user
  indirect?: ModuleDraft[] // modules assigned through permissions granted to the user (e.g. admin, PAV, …)
  pos?: string[] // resolved POs if indirect is set
  accreditationPOs?: string[] // POs which are currently in accreditation
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
