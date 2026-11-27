import { getRequestEvent, query } from '$app/server'
import { assessmentMethodCountsSchema } from '$lib/schemas/assessment-method'
import { fetchBackendJson } from '$lib/server/backend/http'

/** Number of modules per assessment method ID; empty if the counts cannot be loaded. */
export const getAssessmentMethodCounts = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    '/api/assessmentMethods/counts',
    assessmentMethodCountsSchema,
    'Anzahl der Module je Prüfungsform konnte nicht geladen werden'
  ).catch((): Record<string, number> => ({}))
})
