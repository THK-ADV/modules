import { command, getRequestEvent, query } from '$app/server'
import { moduleReviewActionRequestSchema } from '$lib/schemas/module-actions'
import { moduleReviewKeySchema } from '$lib/schemas/module-review'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'
import { getCurrentUserInfo } from '../../routes/user-info.remote'

/** Approves or rejects the given reviews of a module. */
export const reviewModule = command(
  moduleReviewActionRequestSchema,
  async ({ action, comment, reviews }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(fetch, '/auth-api/moduleReviews', 'Modul-Review fehlgeschlagen', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment: comment || null, reviews })
    })
    // the sidebar shows the reviews left to approve
    await getCurrentUserInfo().refresh()
  }
)

/** GitLab URL of the merge request of the module draft. */
export const getMergeRequestUrl = command(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    `/auth-api/moduleDrafts/${id}/mrurl`,
    z.string(),
    'Fehler beim Abrufen der GitLab URL'
  )
})

/** Module attributes whose change requires a review; empty if they cannot be loaded. */
export const getModuleReviewKeys = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    '/api/moduleReviewKeys',
    z.array(moduleReviewKeySchema),
    'Prüfrelevante Modulattribute konnten nicht geladen werden'
  ).catch(() => [])
})
