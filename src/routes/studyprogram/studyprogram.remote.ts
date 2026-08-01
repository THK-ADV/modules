import { command, getRequestEvent } from '$app/server'
import { examListReleaseRequestSchema } from '$lib/schemas/exam-list'
import { uploadModuleCatalogIntroInputSchema } from '$lib/schemas/module-catalog'
import { fetchBackend } from '$lib/server/backend/http'

export const publishExamList = command(
  examListReleaseRequestSchema,
  async ({ semester, date, po }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(
      fetch,
      `/auth-api/examLists/${encodeURIComponent(po)}`,
      'Freigabe der Prüfungsliste fehlgeschlagen',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semester, date: date.toISOString() })
      }
    )
  }
)

export const uploadModuleCatalogIntro = command(
  uploadModuleCatalogIntroInputSchema,
  async ({ poId, file }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(
      fetch,
      `/auth-api/moduleCatalogIntros/${encodeURIComponent(poId)}`,
      'Fehler beim Hochladen der Einleitung',
      {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: await file.arrayBuffer()
      }
    )
  }
)
