import { command, getRequestEvent, query } from '$app/server'
import { moduleDraftActionRequestSchema } from '$lib/schemas/module-actions'
import {
  moduleDraftsResponseSchema,
  type ModuleDraft,
  type ModuleDraftResponse,
  type ModuleDraftState
} from '$lib/schemas/module-draft'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'
import { getCurrentUserInfo } from '../user-info.remote'

/** Rank of each state in the module draft list. */
const stateRank: Record<ModuleDraftState, number> = {
  waiting_for_changes: 0,
  valid_for_publication: 1,
  valid_for_review: 2,
  waiting_for_publication: 3,
  waiting_for_review: 4,
  published: 5,
  unknown: 6
}

/**
 * Fast forward approval is granted if any mandatory or optional PO of the module is allowed, either
 * itself or, if it has a specialization (a third part delimited by an underscore), without it.
 */
function canBeFastForwardApproved(
  module: ModuleDraftResponse,
  fastForwardApprovalPOs: string[] | undefined
) {
  if (!fastForwardApprovalPOs) return false
  return [...(module.mandatoryPOs ?? []), ...(module.optionalPOs ?? [])].some((po) => {
    const parts = po.split('_')
    return (
      fastForwardApprovalPOs.includes(po) ||
      (parts.length === 3 && fastForwardApprovalPOs.includes(`${parts[0]}_${parts[1]}`))
    )
  })
}

/** Module drafts of the user, ordered by state and title; `hasAdditionalModules` tells whether role-derived ones exist. */
export const getModuleDrafts = query(async () => {
  const { fetch } = getRequestEvent()
  const [parsed, userInfo] = await Promise.all([
    fetchBackendJson(
      fetch,
      '/auth-api/moduleDrafts',
      moduleDraftsResponseSchema,
      'Module konnten nicht geladen werden'
    ),
    getCurrentUserInfo()
  ])
  const accreditationPOs = parsed.accreditationPOs
  const isPartOfAccreditation = (m: ModuleDraftResponse) =>
    !!accreditationPOs && !!m.mandatoryPOs?.some((po) => accreditationPOs.includes(po))
  const canFastForward = (m: ModuleDraftResponse) =>
    canBeFastForwardApproved(m, userInfo?.fastForwardApprovalPOs)

  const moduleDrafts: ModuleDraft[] = []
  const directlyAssigned = new Map<string, ModuleDraft>()

  for (const m of parsed.direct) {
    const draft: ModuleDraft = {
      ...m,
      isDirectlyAssigned: true,
      isDerivedFromRole: false,
      isPartOfAccreditation: false,
      canBeFastForwardApproved: canFastForward(m)
    }
    moduleDrafts.push(draft)
    directlyAssigned.set(m.module.id, draft)
  }

  for (const m of parsed.indirect ?? []) {
    const draft = directlyAssigned.get(m.module.id)
    if (draft) {
      // update the module if it's directly assigned
      draft.isDerivedFromRole = true
      draft.isPartOfAccreditation = isPartOfAccreditation(draft)
    } else {
      moduleDrafts.push({
        ...m,
        isDirectlyAssigned: false,
        isDerivedFromRole: true,
        isPartOfAccreditation: isPartOfAccreditation(m),
        canBeFastForwardApproved: canFastForward(m)
      })
    }
  }

  moduleDrafts.sort(
    (a, b) =>
      stateRank[a.moduleDraftState] - stateRank[b.moduleDraftState] ||
      a.module.title.localeCompare(b.module.title)
  )

  const hasAdditionalModules = parsed.indirect != null

  return { moduleDrafts, hasAdditionalModules }
})

/** Method, backend resource, path suffix and error message of each module draft action. */
const draftActions = {
  delete: ['DELETE', 'moduleDrafts', '', 'Fehler beim Löschen des Module Drafts'],
  publish: ['POST', 'moduleReviews', '', 'Fehler beim Übernehmen der Änderungen'],
  requestReview: ['POST', 'moduleReviews', '', 'Fehler bei der Anfrage des Reviews'],
  requestFastForwardReview: [
    'POST',
    'moduleReviews',
    '/ff',
    'Fehler beim Überspringen des Reviews'
  ],
  cancelReview: ['DELETE', 'moduleReviews', '', 'Fehler beim Zurückziehen des Reviews']
} as const

/** Runs a workflow action on the module draft and refreshes the module drafts and user info. */
export const runModuleDraftAction = command(
  moduleDraftActionRequestSchema.extend({ id: z.uuid() }),
  async ({ id, action }) => {
    const { fetch } = getRequestEvent()
    const [method, resource, suffix, message] = draftActions[action]
    await fetchBackend(fetch, `/auth-api/${resource}/${id}${suffix}`, message, { method })
    // the sidebar shows rejected reviews and reviews to approve
    await Promise.all([getModuleDrafts().refresh(), getCurrentUserInfo().refresh()])
  }
)
