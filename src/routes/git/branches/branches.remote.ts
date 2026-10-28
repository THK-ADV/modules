import { command, getRequestEvent, query } from '$app/server'
import { branchConsistencySchema } from '$lib/schemas/branch-consistency'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

export const getBranchConsistency = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    '/auth-api/moduleDrafts/branch-consistency',
    branchConsistencySchema,
    'Der Abgleich mit GitLab konnte nicht geladen werden'
  )
})

/** Deletes the module draft together with its branch, merge request and reviews. Missing parts are skipped. */
export const deleteModuleDraft = command(z.uuid(), async (moduleId) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(fetch, `/auth-api/moduleDrafts/${moduleId}`, 'Fehler beim Löschen', {
    method: 'DELETE'
  })
  await getBranchConsistency().refresh()
})
