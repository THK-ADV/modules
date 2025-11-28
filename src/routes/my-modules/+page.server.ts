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

// This function assumes that the specialization is delimited by an underscore at the end of the PO
function checkSpecialization(maybeFullPO: string, allowedPOs: string[]) {
  const poParts = maybeFullPO.split('_')
  if (poParts.length === 2) {
    // default PO
    return allowedPOs.includes(maybeFullPO)
  } else if (poParts.length === 3) {
    // full PO with specialization. Check the PO without the specialization
    const po = poParts[0] + '_' + poParts[1]
    return allowedPOs.includes(po)
  } else {
    return false
  }
}

function canBeFastForwardApproved(
  module: ModuleDraft,
  fastForwardApprovalPOs: string[] | undefined
) {
  if (!fastForwardApprovalPOs) return false
  // fast forward approval is granted, if any of the mandatory or optional POs of the module are in the allowed list.
  // This may be extended so that ALL module POs must match
  // We assume that most POs are not specialized, so we check the full PO first

  // Check mandatory POs
  if (module.mandatoryPOs && module.mandatoryPOs.length > 0) {
    const hasMandatoryMatch = module.mandatoryPOs.some(
      (po) => fastForwardApprovalPOs.includes(po) || checkSpecialization(po, fastForwardApprovalPOs)
    )
    if (hasMandatoryMatch) return true
  }

  // Check optional POs
  if (module.optionalPOs && module.optionalPOs.length > 0) {
    return module.optionalPOs.some(
      (po) => fastForwardApprovalPOs.includes(po) || checkSpecialization(po, fastForwardApprovalPOs)
    )
  }

  return false
}

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { userInfo } = await parent()
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
    m.canBeFastForwardApproved = canBeFastForwardApproved(m, userInfo?.fastForwardApprovalPOs)
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
        m.canBeFastForwardApproved = canBeFastForwardApproved(m, userInfo?.fastForwardApprovalPOs)
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
