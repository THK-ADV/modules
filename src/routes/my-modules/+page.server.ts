import type { ModuleDraft, ModuleDraftState } from '$lib/types/module-draft'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

interface ParsedModuleDrafts {
  direct: ModuleDraft[] // modules directly assigned to the user
  indirect?: ModuleDraft[] // modules assigned through permissions granted to the user (e.g. admin, PAV, …)
  pos?: string[] // resolved POs if indirect is set
  accreditationPOs?: string[] // POs which are currently in accreditation
}

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

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch(`/auth-api/moduleDrafts`)

  if (!res.ok) {
    const err = await res.json()
    const message = `Module konnten nicht geladen werden: ${err.message}`
    throw error(res.status, { message })
  }

  const parsed: ParsedModuleDrafts = await res.json()
  const moduleDrafts: ModuleDraft[] = []
  let i = 0
  const directlyAssigned: Record<string, number> = {}

  for (const m of parsed.direct) {
    m.isDirectlyAssigned = true
    m.isDerivedFromRole = false
    m.isPartOfAccreditation = false
    moduleDrafts.push(m)
    directlyAssigned[m.module.id] = i
    i++
  }

  if (parsed.indirect) {
    for (const m of parsed.indirect) {
      if (m.module.id in directlyAssigned) {
        // update the module if it's directly assigned
        const mod = moduleDrafts[directlyAssigned[m.module.id]]
        mod.isDerivedFromRole = true

        if (parsed.accreditationPOs != null && mod.mandatoryPOs != null) {
          const accreditationPOs = parsed.accreditationPOs
          mod.isPartOfAccreditation = mod.mandatoryPOs.some((po) => accreditationPOs.includes(po))
        }
      } else {
        // insert the new module
        m.isDirectlyAssigned = false
        m.isDerivedFromRole = true
        m.isPartOfAccreditation = false

        if (parsed.accreditationPOs != null && m.mandatoryPOs != null) {
          const accreditationPOs = parsed.accreditationPOs
          m.isPartOfAccreditation = m.mandatoryPOs.some((po) => accreditationPOs.includes(po))
        }

        moduleDrafts.push(m)
      }
    }
  }

  moduleDrafts.sort((a, b) => {
    const byState = orderByState(a, b)
    if (byState !== 0) return byState
    return orderByTitle(a, b)
  })

  const hasAdditionalModules = parsed.indirect != null

  return { moduleDrafts, hasAdditionalModules }
}
