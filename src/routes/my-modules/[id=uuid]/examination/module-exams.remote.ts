import { getRequestEvent, query } from '$app/server'
import { moduleExamsSchema } from '$lib/schemas/module-exams'
import { fetchBackendJson } from '$lib/server/backend/http'
import { isHttpError } from '@sveltejs/kit'
import { z } from 'zod/v4'

/** Title and exams of the live module, or `null` if the module is not live yet (404). */
export const getModuleExams = query(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    `/auth-api/modules/${id}/exams`,
    moduleExamsSchema,
    'Die Prüfungen konnten nicht geladen werden'
  ).catch((e) => {
    if (isHttpError(e, 404)) return null
    throw e
  })
})
