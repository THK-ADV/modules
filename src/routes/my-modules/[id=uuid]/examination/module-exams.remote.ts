import { command, getRequestEvent, query } from '$app/server'
import { moduleExamsSchema, moduleExamsUpdateSchema } from '$lib/schemas/module-exams'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { error } from '@sveltejs/kit'
import { z } from 'zod/v4'

/** Title and exam names of the live module, or `null` if the module is not live yet (404). */
export const getModuleExams = query(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  const resp = await fetchBackend(
    fetch,
    `/auth-api/moduleExams/${id}`,
    'Die Prüfungsnamen konnten nicht geladen werden',
    undefined,
    [404]
  )
  if (resp.status === 404) return null
  const result = moduleExamsSchema.safeParse(await resp.json().catch(() => null))
  if (!result.success)
    throw error(502, { message: 'Die Prüfungsnamen konnten nicht geladen werden' })
  return result.data
})

export const updateModuleExams = command(
  moduleExamsUpdateSchema.extend({ id: z.uuid() }),
  async ({ id, examNames }) => {
    const { fetch } = getRequestEvent()
    const saved = await fetchBackendJson(
      fetch,
      `/auth-api/moduleExams/${id}`,
      moduleExamsUpdateSchema,
      'Die Prüfungsnamen konnten nicht gespeichert werden',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examNames })
      }
    )
    await getModuleExams(id).refresh()
    return saved
  }
)
