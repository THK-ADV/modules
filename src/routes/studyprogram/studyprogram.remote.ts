import { command, getRequestEvent } from '$app/server'
import { examListReleaseRequestSchema } from '$lib/schemas/exam-list'
import { fetchBackend } from '$lib/server/backend/http'
import { z } from 'zod/v4'

const MODULE_CATALOG_INTRO_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

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
  z.object({
    poId: z.string().trim().min(1),
    file: z.file().max(10 * 1024 * 1024)
  }),
  async ({ poId, file }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(
      fetch,
      `/auth-api/moduleCatalogIntros/${encodeURIComponent(poId)}`,
      'Fehler beim Hochladen der Einleitung',
      {
        method: 'POST',
        headers: { 'Content-Type': MODULE_CATALOG_INTRO_MIME },
        body: await file.arrayBuffer()
      }
    )
  }
)
