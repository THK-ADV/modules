import { command, getRequestEvent, query } from '$app/server'
import { moduleReviewActionRequestSchema } from '$lib/schemas/module-actions'
import { fetchBackend } from '$lib/server/backend/http'
import { z } from 'zod/v4'

export const submitModuleReview = command(moduleReviewActionRequestSchema, async (payload) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(fetch, '/auth-api/moduleReviews', 'Modul-Review fehlgeschlagen', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: payload.action,
      comment: payload.comment || null,
      reviews: payload.reviews
    })
  })
})

export const getModuleDraftMrUrl = query(z.string().trim().min(1), async (moduleId) => {
  const { fetch } = getRequestEvent()
  const response = await fetchBackend(
    fetch,
    `/auth-api/moduleDrafts/${encodeURIComponent(moduleId)}/mrurl`,
    'Fehler beim Abrufen der GitLab URL'
  )
  // Backend returns a JSON-encoded string (quoted)
  return (await response.text()).slice(1, -1)
})
