import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export type ModuleDraftTableAction = 'delete' | 'publish' | 'requestReview' | 'cancelReview'

async function deleteModuleDraft(moduleId: string, fetch: typeof globalThis.fetch) {
  const response = await fetch(`/auth-api/moduleDrafts/${moduleId}`, { method: 'DELETE' })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw error(response.status, {
      message:
        errorData.message ||
        `Fehler beim Löschen des Module Drafts: ${response.status} ${response.statusText}`
    })
  }

  return json({ success: true })
}

async function createReview(
  moduleId: string,
  needsApproval: boolean,
  fetch: typeof globalThis.fetch
) {
  const response = await fetch(`/auth-api/moduleReviews/${moduleId}`, { method: 'POST' })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw error(response.status, {
      message:
        errorData.message ||
        (needsApproval
          ? `Fehler bei der Anfrage des Reviews: ${response.status} ${response.statusText}`
          : `Fehler beim Übernehmen der Änderungen: ${response.status} ${response.statusText}`)
    })
  }

  return json({ success: true })
}

async function cancelReview(moduleId: string, fetch: typeof globalThis.fetch) {
  const response = await fetch(`/auth-api/moduleReviews/${moduleId}`, { method: 'DELETE' })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw error(response.status, {
      message:
        errorData.message ||
        `Fehler beim Zurückziehen des Reviews: ${response.status} ${response.statusText}`
    })
  }

  return json({ success: true })
}

export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const { moduleId } = params
  const { action }: { action: ModuleDraftTableAction } = await request.json()

  switch (action) {
    case 'delete':
      return deleteModuleDraft(moduleId, fetch)
    case 'publish':
      return createReview(moduleId, false, fetch)
    case 'requestReview':
      return createReview(moduleId, true, fetch)
    case 'cancelReview':
      return cancelReview(moduleId, fetch)
  }
}
