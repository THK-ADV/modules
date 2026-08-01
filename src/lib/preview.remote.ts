import { command, getRequestEvent } from '$app/server'
import {
  artifactPoInputSchema,
  moduleCatalogArtifactInputSchema
} from '$lib/schemas/artifact-action'
import { fetchBackend } from '$lib/server/backend/http'

async function fetchPdf(
  fetch: typeof globalThis.fetch,
  url: string,
  fallbackMessage: string,
  init?: RequestInit
) {
  const response = await fetchBackend(fetch, url, fallbackMessage, init)
  return {
    type: 'pdf' as const,
    data: new Uint8Array(await response.arrayBuffer())
  }
}

export const previewModuleCatalog = command(
  moduleCatalogArtifactInputSchema,
  async ({ po, config }) => {
    const { fetch } = getRequestEvent()
    return fetchPdf(
      fetch,
      `/auth-api/moduleCatalogs/${encodeURIComponent(po)}?preview=true`,
      'Fehler beim Erzeugen der Modulhandbuch-Vorschau',
      {
        method: 'POST',
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      }
    )
  }
)

export const createModuleCatalog = command(
  moduleCatalogArtifactInputSchema,
  async ({ po, config }) => {
    const { fetch } = getRequestEvent()
    return fetchPdf(
      fetch,
      `/auth-api/moduleCatalogs/${encodeURIComponent(po)}?preview=false`,
      'Fehler beim Erzeugen des Modulhandbuchs',
      {
        method: 'POST',
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      }
    )
  }
)

export const previewExamList = command(artifactPoInputSchema, async ({ po }) => {
  const { fetch } = getRequestEvent()
  return fetchPdf(
    fetch,
    `/auth-api/examLists/preview/${encodeURIComponent(po)}`,
    'Fehler beim Erzeugen der Prüfungslisten-Vorschau',
    { headers: { Accept: 'application/pdf' } }
  )
})

export const previewExamLoad = command(artifactPoInputSchema, async ({ po }) => {
  const { fetch } = getRequestEvent()
  const response = await fetchBackend(
    fetch,
    `/auth-api/examLoad/${encodeURIComponent(po)}?preview=true`,
    'Fehler beim Erzeugen der Prüfungslast-Vorschau',
    { headers: { Accept: 'text/csv' } }
  )
  return {
    type: 'csv' as const,
    data: await response.text()
  }
})
