import { command, getRequestEvent, query } from '$app/server'
import {
  examChoiceSchema,
  examMergeSchema,
  examSchema,
  examsSchema,
  examWriteSchema
} from '$lib/schemas/exams'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

const exams = '/auth-api/exams'
const json = (method: string, body: unknown) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})

/** All exams with their modules and the modules without exam. */
export const getExams = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(fetch, exams, examsSchema, 'Prüfungen konnten nicht geladen werden')
})

/** All exams reduced to the choice of an exam; parsing drops the other fields before they reach the client. */
export const getExamChoices = query(async () => {
  const { fetch } = getRequestEvent()
  const { exams: choices } = await fetchBackendJson(
    fetch,
    exams,
    z.object({ exams: z.array(examChoiceSchema) }),
    'Prüfungen konnten nicht geladen werden'
  )
  return choices
})

export const createExam = command(examWriteSchema, async (exam) => {
  const { fetch } = getRequestEvent()
  const created = await fetchBackendJson(
    fetch,
    exams,
    examSchema,
    'Prüfung konnte nicht angelegt werden',
    json('POST', exam)
  )
  await getExams().refresh()
  return created
})

/** Replaces name and modules of the exam. */
export const updateExam = command(
  examWriteSchema.extend({ id: z.uuid() }),
  async ({ id, ...exam }) => {
    const { fetch } = getRequestEvent()
    const updated = await fetchBackendJson(
      fetch,
      `${exams}/${id}`,
      examSchema,
      'Prüfung konnte nicht gespeichert werden',
      json('PUT', exam)
    )
    await getExams().refresh()
    return updated
  }
)

/** Fails with 409 and the backend message if the exam is planned or published in an exam list. */
export const deleteExam = command(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(fetch, `${exams}/${id}`, 'Prüfung konnte nicht gelöscht werden', {
    method: 'DELETE'
  })
  await getExams().refresh()
})

/** Merges the sources into the target, re-pointing all references to it. */
export const mergeExams = command(examMergeSchema, async (merge) => {
  const { fetch } = getRequestEvent()
  const merged = await fetchBackendJson(
    fetch,
    `${exams}/merge`,
    examSchema,
    'Prüfungen konnten nicht zusammengeführt werden',
    json('POST', merge)
  )
  await getExams().refresh()
  return merged
})
