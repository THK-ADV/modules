import { command, getRequestEvent, query } from '$app/server'
import {
  moduleChangesSchema,
  modulePublicationRequestSchema,
  modulePublicationResultSchema,
  modulePublicationTitleSchema
} from '$lib/schemas/module-publication'
import { fetchBackendJson } from '$lib/server/backend/http'

const url = '/auth-api/admin/softBigBang'

/** Modules whose files differ between main and the current preview revision. */
export const getModuleChanges = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    url,
    moduleChangesSchema,
    'Die Änderungen aus preview konnten nicht geladen werden'
  )
})

export const getPublicationTitle = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    `${url}/title`,
    modulePublicationTitleSchema,
    'Der Titelvorschlag konnte nicht geladen werden'
  )
})

/**
 * Opens a merge request with the selected modules, which the backend checks and merges into main. Fails with 409 if
 * a publication is pending. Returns the IDs of selected modules that changed in main or preview since the comparison
 * instead (412), so they can be named.
 */
export const publishModules = command(modulePublicationRequestSchema, async (request) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    url,
    modulePublicationResultSchema,
    'Die Veröffentlichung konnte nicht gestartet werden',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    },
    [412]
  )
})
