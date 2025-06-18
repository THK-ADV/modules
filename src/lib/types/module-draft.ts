export type ModuleDraftState =
  | 'published'
  | 'valid_for_review'
  | 'valid_for_publication'
  | 'waiting_for_changes'
  | 'waiting_for_review'
  | 'waiting_for_publication'
  | 'unknown'

export interface ModuleDraft {
  module: {
    id: string
    title: string
    abbrev: string
  }
  moduleDraft: {
    module: string
    author: string
    // added or modified
    status: string
    data: Record<string, unknown> & {
      metadata: {
        title: string
        abbrev: string
      }
    }
  } | null
  moduleDraftState: {
    id: ModuleDraftState
    deLabel: string
  }
  // true, if module manager
  privilegedForModule: boolean
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
