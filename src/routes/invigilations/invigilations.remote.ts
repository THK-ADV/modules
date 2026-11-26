import { getRequestEvent, query } from '$app/server'
import { examPlanningLabelSchemas, invigilationPageSchema } from '$lib/schemas/exam-planning'
import { fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

const PAGE_SIZE = 20
const entriesError = 'Klausurtermine konnten nicht geladen werden'
const labelError = 'Stammdaten konnten nicht geladen werden'

/** All published appointments that have not ended, earliest first; the page filters them by person. */
export const getUpcomingInvigilations = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    '/auth-api/invigilations?past=false',
    invigilationPageSchema,
    entriesError
  )
})

/**
 * A page of 20 ended appointments in which `person` invigilates, of all with `null`, newest first; `more` tells whether
 * a further page exists.
 */
export const getPastInvigilations = query(
  z.object({ person: z.string().min(1).nullable(), page: z.number().int().nonnegative() }),
  async ({ person, page }) => {
    const { fetch } = getRequestEvent()
    const params = new URLSearchParams({
      past: 'true',
      limit: String(PAGE_SIZE + 1),
      offset: String(page * PAGE_SIZE),
      ...(person && { person })
    })
    const { entries, publishedAt } = await fetchBackendJson(
      fetch,
      `/auth-api/invigilations?${params}`,
      invigilationPageSchema,
      entriesError
    )
    return { entries: entries.slice(0, PAGE_SIZE), publishedAt, more: entries.length > PAGE_SIZE }
  }
)

/**
 * Exam phase labels and all identities, to pick persons from and to name examiners and invigilators by.
 *
 * TODO: There is no pool of invigilators yet, so the person picker offers every identity. It should only offer persons
 * who are eligible to invigilate and are assigned to at least one invigilation; examiners still need their names.
 */
export const getInvigilationLabels = query(async () => {
  const { fetch } = getRequestEvent()
  const [examPhases, identities] = await Promise.all([
    fetchBackendJson(fetch, '/api/examPhases', examPlanningLabelSchemas.examPhases, labelError),
    fetchBackendJson(fetch, '/api/identities', examPlanningLabelSchemas.identities, labelError)
  ])
  return { examPhases, identities }
})
