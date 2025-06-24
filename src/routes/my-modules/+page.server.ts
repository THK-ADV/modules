import type { FeaturedModuleDraft, ModuleDraft, ModuleDraftState } from '$lib/types/module-draft'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

function moduleDraftStateOrd(state: ModuleDraftState): number {
  switch (state) {
    case 'waiting_for_changes':
      return 0
    case 'valid_for_publication':
      return 1
    case 'valid_for_review':
      return 2
    case 'waiting_for_publication':
      return 3
    case 'waiting_for_review':
      return 4
    case 'published':
      return 5
    case 'unknown':
      return 6
  }
}

function orderByState(lhs: ModuleDraft, rhs: ModuleDraft) {
  const lhsState = moduleDraftStateOrd(lhs.moduleDraftState)
  const rhsState = moduleDraftStateOrd(rhs.moduleDraftState)
  return lhsState - rhsState
}

function orderByTitle(lhs: ModuleDraft, rhs: ModuleDraft) {
  return lhs.module.title.localeCompare(rhs.module.title)
}

function orderByFeaturedPO(lhs: FeaturedModuleDraft, rhs: FeaturedModuleDraft) {
  const lhsFeatured = lhs.isFeatured
  const rhsFeatured = rhs.isFeatured
  return lhsFeatured === rhsFeatured ? 0 : lhsFeatured ? -1 : 1
}

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch(`/api/moduleDrafts/own?newApi=true`)

  if (!res.ok) {
    const err = await res.json()
    const message = `Module konnten nicht geladen werden: ${err.message}`
    throw error(res.status, { message })
  }
  const moduleDrafts: ModuleDraft[] = await res.json()
  const featuredPOs = ['ing_een5', 'ing_gme5', 'ing_wiw5']

  const featuredDrafts: FeaturedModuleDraft[] = moduleDrafts.map((draft) => {
    if (draft.isNewModule && draft.mandatoryPOs.some((po) => featuredPOs.includes(po))) {
      return { ...draft, isFeatured: true }
    }
    return { ...draft, isFeatured: false }
  })

  featuredDrafts.sort((a, b) => {
    const byFeaturedPO = orderByFeaturedPO(a, b)
    if (byFeaturedPO !== 0) return byFeaturedPO
    const byState = orderByState(a, b)
    if (byState !== 0) return byState
    return orderByTitle(a, b)
  })

  return { moduleDrafts: featuredDrafts }
}
