import { command, getRequestEvent, query } from '$app/server'
import { permissionFormSchema, permissionSchema } from '$lib/schemas/permission'
import { studyProgramSchema } from '$lib/schemas/study-program'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

/** An empty context is stored as null, which means "no PO at all". */
const toContext = (context: string[]) => (context.length === 0 ? null : context)

export const getPermissions = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    '/auth-api/permissions',
    z.array(permissionSchema),
    'Fehler beim Laden der Berechtigungen'
  )
})

export const getStudyPrograms = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    '/api/studyPrograms?filter=not-expired',
    z.array(studyProgramSchema),
    'Fehler beim Laden der Studiengänge'
  )
})

export const createPermission = command(
  permissionFormSchema,
  async ({ person, permType, context }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(fetch, '/auth-api/permissions', 'Fehler beim Anlegen der Berechtigung', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person, permType: { id: permType }, context: toContext(context) })
    })
    await getPermissions().refresh()
  }
)

/** Only the context of a permission can be changed. */
export const updatePermissionContext = command(
  z.object({ id: z.number().int(), context: z.array(z.string()) }),
  async ({ id, context }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(
      fetch,
      `/auth-api/permissions/${id}`,
      'Fehler beim Speichern der Berechtigung',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toContext(context))
      }
    )
    await getPermissions().refresh()
  }
)

export const deletePermission = command(z.number().int(), async (id) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(fetch, `/auth-api/permissions/${id}`, 'Fehler beim Löschen der Berechtigung', {
    method: 'DELETE'
  })
  await getPermissions().refresh()
})
