import type { ModuleDraft, ModuleDrafts, ModuleDraftState } from '$lib/types/module-draft'
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

function orderByAccreditation(
  newModules: string[]
): (lhs: ModuleDraft, rhs: ModuleDraft) => number {
  return (lhs, rhs) => {
    const lhsFeatured = newModules.some((id) => lhs.module.id === id)
    const rhsFeatured = newModules.some((id) => rhs.module.id === id)
    // this is a hack to get the featured modules in the table
    if (lhsFeatured) {
      lhs.isFeatured = true
    }
    if (rhsFeatured) {
      rhs.isFeatured = true
    }
    return lhsFeatured === rhsFeatured ? 0 : lhsFeatured ? -1 : 1
  }
}

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch(`/api/moduleDrafts/own?newApi=true`)

  if (!res.ok) {
    const err = await res.json()
    const message = `Module konnten nicht geladen werden: ${err.message}`
    throw error(res.status, { message })
  }
  const moduleDrafts: ModuleDrafts = await res.json()
  const byAccreditationOrder = moduleDrafts.accreditation
    ? orderByAccreditation(moduleDrafts.accreditation.map((m) => m.module.id))
    : undefined

  moduleDrafts.default.sort((a, b) => {
    let byFeaturedAccreditation = 0
    if (byAccreditationOrder !== undefined) {
      byFeaturedAccreditation = byAccreditationOrder(a, b)
    }
    if (byFeaturedAccreditation !== 0) return byFeaturedAccreditation
    const byState = orderByState(a, b)
    if (byState !== 0) return byState
    return orderByTitle(a, b)
  })

  moduleDrafts.accreditation?.sort((a, b) => {
    // this is a hack to get the featured modules in the table
    a.isFeatured = true
    b.isFeatured = true

    const byState = orderByState(a, b)
    if (byState !== 0) return byState
    return orderByTitle(a, b)
  })

  return { moduleDrafts }
}
