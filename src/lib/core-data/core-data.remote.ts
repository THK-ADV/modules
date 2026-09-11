import { command, getRequestEvent, query } from '$app/server'
import { coreDataFormSchemas, coreDataKeySchema, coreDataSchemas } from '$lib/schemas/core-data'
import { fetchBackend, fetchBackendJson, parseBackendRequestInput } from '$lib/server/backend/http'
import { z } from 'zod/v4'

function coreDataPath(entity: string, id?: string): string {
  let base = `/auth-api/core-data/${entity.toLowerCase()}`
  if (id !== undefined && id !== '') {
    base += `/${encodeURIComponent(id)}`
  }
  return base
}

export const getCoreData = query(coreDataKeySchema, async (entity) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    coreDataPath(entity),
    z.array(coreDataSchemas[entity]),
    'Fehler beim Laden der Stammdaten'
  )
})

export const saveCoreData = command(
  z.object({
    entity: coreDataKeySchema,
    id: z.string().min(1).optional(),
    data: z.record(z.string(), z.unknown())
  }),
  async ({ entity, id, data }) => {
    const { fetch } = getRequestEvent()
    const payload = parseBackendRequestInput(coreDataFormSchemas[entity], data, 'Ungültige Eingabe')
    await fetchBackend(fetch, coreDataPath(entity, id), 'Fehler beim Speichern', {
      method: id !== undefined ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    await getCoreData(entity).refresh()
  }
)
