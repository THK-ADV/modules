import { command, getRequestEvent } from '$app/server'
import { permittedAssessmentMethodsSchema } from '$lib/schemas/module'
import { fetchBackend } from '$lib/server/backend/http'
import { z } from 'zod/v4'

export const updateModulePermittedAssessmentMethods = command(
  z.object({ id: z.uuid(), permittedAssessmentMethods: permittedAssessmentMethodsSchema }),
  async ({ id, permittedAssessmentMethods }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(
      fetch,
      `/auth-api/modules/${id}/assessmentMethods`,
      'Fehler beim Aktualisieren der zulässigen Prüfungsformen',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permittedAssessmentMethods)
      }
    )
  }
)
