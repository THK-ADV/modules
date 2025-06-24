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
  isNewModule: boolean
  // true, if module manager
  isPrivilegedForModule: boolean
  ects: number
  mandatoryPOs: string[]
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

export interface FeaturedModuleDraft extends ModuleDraft {
  isFeatured: boolean
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
