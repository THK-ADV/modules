import { command, getRequestEvent } from '$app/server'
import { updatePermissionsSchema } from '$lib/schemas/module'
import { fetchBackend } from '$lib/server/backend/http'
import { z } from 'zod/v4'

export const updateModulePermissions = command(
  z.object({ id: z.uuid(), updatePermissions: updatePermissionsSchema }),
  async ({ id, updatePermissions }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(
      fetch,
      `/auth-api/moduleUpdatePermissions/${id}`,
      'Fehler beim Aktualisieren der Modul-Zugriffsrechte',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePermissions)
      }
    )
  }
)
