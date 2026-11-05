import type { ModuleDraftResponse } from '$lib/schemas/module-draft'

export const MODULE_DRAFT_STATES = [
  'published',
  'valid_for_review',
  'valid_for_publication',
  'waiting_for_changes',
  'waiting_for_review',
  'waiting_for_publication',
  'unknown'
] as const

export type ModuleDraftState = (typeof MODULE_DRAFT_STATES)[number]

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
