import { command, getRequestEvent } from '$app/server'
import { moduleDraftActionInputSchema } from '$lib/schemas/module-actions'
import { fetchBackend } from '$lib/server/backend/http'

export const performModuleDraftAction = command(
  moduleDraftActionInputSchema,
  async ({ moduleId, action }) => {
    const { fetch } = getRequestEvent()
    const encodedId = encodeURIComponent(moduleId)

    switch (action) {
      case 'delete':
        await fetchBackend(
          fetch,
          `/auth-api/moduleDrafts/${encodedId}`,
          'Fehler beim Löschen des Module Drafts',
          { method: 'DELETE' }
        )
        return
      case 'publish':
      case 'requestReview':
        await fetchBackend(
          fetch,
          `/auth-api/moduleReviews/${encodedId}`,
          action === 'publish'
            ? 'Fehler beim Übernehmen der Änderungen'
            : 'Fehler bei der Anfrage des Reviews',
          { method: 'POST' }
        )
        return
      case 'requestFastForwardReview':
        await fetchBackend(
          fetch,
          `/auth-api/moduleReviews/${encodedId}/ff`,
          'Fehler beim Überspringen des Reviews',
          { method: 'POST' }
        )
        return
      case 'cancelReview':
        await fetchBackend(
          fetch,
          `/auth-api/moduleReviews/${encodedId}`,
          'Fehler beim Zurückziehen des Reviews',
          { method: 'DELETE' }
        )
    }
  }
)
