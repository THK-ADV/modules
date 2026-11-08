import { getRequestEvent, query } from '$app/server'
import { moduleExamsSchema } from '$lib/schemas/module-exams'
import { fetchBackend } from '$lib/server/backend/http'
import { error } from '@sveltejs/kit'
import { z } from 'zod/v4'

/** Title and exams of the live module, or `null` if the module is not live yet (404). */
export const getModuleExams = query(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  const resp = await fetchBackend(
    fetch,
    `/auth-api/modules/${id}/exams`,
    'Die Prüfungen konnten nicht geladen werden',
    undefined,
    [404]
  )
  if (resp.status === 404) return null
  const result = moduleExamsSchema.safeParse(await resp.json().catch(() => null))
  if (!result.success) throw error(502, { message: 'Die Prüfungen konnten nicht geladen werden' })
  return result.data
})
