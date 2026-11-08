import { command, getRequestEvent, query } from '$app/server'
import {
  examEntryCreateSchema,
  examEntryDraftSchema,
  examEntryUpdateSchema,
  examOfferSchema,
  examPlanSchema,
  examPlanningLabelSchemas,
  examPoolConfigSchema,
  examPoolSelectionSchema,
  examRoomsUpdateSchema,
  invigilatorAssignmentSchema
} from '$lib/schemas/exam-planning'
import { planDraftResponseSchema } from '$lib/schemas/plan-draft'
import { semesterSchema } from '$lib/schemas/semester'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { error } from '@sveltejs/kit'
import { z } from 'zod/v4'

const plans = '/auth-api/examPlans'
const json = (method: string, body: unknown) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
const labelError = 'Stammdaten konnten nicht geladen werden'
const semesterId = examPoolSelectionSchema.shape.semester
const draftEntrySchema = z.object({ draftId: z.uuid(), id: z.uuid() })

/** Exam plans and the semesters of published exam lists as well as the current and next one. */
export const getExamPlans = query(async () => {
  const { fetch } = getRequestEvent()
  const [examPlans, semesters] = await Promise.all([
    fetchBackendJson(
      fetch,
      plans,
      z.array(planDraftResponseSchema),
      'Prüfungspläne konnten nicht geladen werden'
    ),
    fetchBackendJson(
      fetch,
      '/api/examLists/semesters',
      z.array(semesterSchema),
      'Semester konnten nicht geladen werden'
    )
  ])
  return { plans: examPlans, semesters }
})

/** Creates the exam plan of the semester and returns its id, as the backend responds without one. */
export const createExamPlan = command(semesterId, async (semester) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(
    fetch,
    plans,
    'Prüfungsplan konnte nicht angelegt werden',
    json('POST', { semester })
  )
  const created = await fetchBackendJson(
    fetch,
    `${plans}?${new URLSearchParams({ semester })}`,
    z.array(planDraftResponseSchema),
    'Prüfungsplan konnte nicht geladen werden'
  )
  await getExamPlans().refresh()
  if (!created[0]) error(404, 'Der angelegte Prüfungsplan wurde nicht gefunden')
  return created[0].id
})

/** Deletes an exam plan that was never published. */
export const deleteExamPlan = command(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  const resp = await fetchBackend(
    fetch,
    `${plans}/${id}`,
    'Prüfungsplan konnte nicht gelöscht werden',
    { method: 'DELETE' },
    [409]
  )
  if (resp.status === 409)
    error(409, 'Ein veröffentlichter Prüfungsplan kann nicht gelöscht werden')
  await getExamPlans().refresh()
})

export const getExamPlan = query(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    `${plans}/${id}`,
    examPlanSchema,
    'Prüfungsplan konnte nicht geladen werden'
  )
})

/** Publishes the current state; the plan stays editable and can be published again. */
export const publishExamPlan = command(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(fetch, `${plans}/${id}/publish`, 'Veröffentlichung fehlgeschlagen', {
    method: 'POST'
  })
  await getExamPlan(id).refresh()
})

/** Pool configuration shared by all users of the plan. */
export const getExamPoolConfig = query(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    `${plans}/${id}/examPoolConfig`,
    examPoolConfigSchema,
    'Auswahl der Prüfungen konnte nicht geladen werden'
  )
})

export const saveExamPoolConfig = command(
  z.object({ draftId: z.uuid(), config: examPoolConfigSchema }),
  async ({ draftId, config }) => {
    const { fetch } = getRequestEvent()
    const saved = await fetchBackendJson(
      fetch,
      `${plans}/${draftId}/examPoolConfig`,
      examPoolConfigSchema,
      'Auswahl der Prüfungen konnte nicht gespeichert werden',
      json('PUT', config)
    )
    getExamPoolConfig(draftId).set(saved)
  }
)

/** Published exams selected by the configuration that have no appointment yet, the whole semester for empty lists. */
export const getExamPool = query(examPoolSelectionSchema, async (config) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    `/auth-api/examPool?${new URLSearchParams({ config: JSON.stringify(config) })}`,
    z.array(examOfferSchema),
    'Prüfungen konnten nicht geladen werden'
  )
})

/** All appointments of the plan; one semester is small enough to load at once. */
export const getExamEntries = query(z.uuid(), async (id) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    `${plans}/${id}/examEntries`,
    z.array(examEntryDraftSchema),
    'Prüfungstermine konnten nicht geladen werden'
  )
})

export const createExamEntry = command(examEntryCreateSchema, async ({ draftId, entry }) => {
  const { fetch } = getRequestEvent()
  const [created] = await fetchBackendJson(
    fetch,
    `${plans}/${draftId}/examEntries`,
    z.array(examEntryDraftSchema).length(1),
    'Termin konnte nicht angelegt werden',
    json('POST', [entry])
  )
  await getExamPlan(draftId).refresh()
  return created
})

/** Moves the appointment or changes its expected participants; rooms are kept. */
export const updateExamEntry = command(examEntryUpdateSchema, async ({ draftId, id, times }) => {
  const { fetch } = getRequestEvent()
  const updated = await fetchBackendJson(
    fetch,
    `${plans}/${draftId}/examEntries/${id}`,
    examEntryDraftSchema,
    'Termin konnte nicht gespeichert werden',
    json('PUT', times)
  )
  await getExamPlan(draftId).refresh()
  return updated
})

/** Replaces all room allocations of the appointment. */
export const updateExamRooms = command(examRoomsUpdateSchema, async ({ draftId, id, rooms }) => {
  const { fetch } = getRequestEvent()
  const updated = await fetchBackendJson(
    fetch,
    `${plans}/${draftId}/examEntries/${id}/rooms`,
    examEntryDraftSchema,
    'Räume konnten nicht gespeichert werden',
    json('PUT', rooms)
  )
  await getExamPlan(draftId).refresh()
  return updated
})

/**
 * Fills open known invigilator demand of the selected rooms of the saved plan from the saved available invigilators,
 * keeping all assignments, and returns all appointments.
 */
export const assignInvigilators = command(
  invigilatorAssignmentSchema,
  async ({ draftId, rooms }) => {
    const { fetch } = getRequestEvent()
    const entries = await fetchBackendJson(
      fetch,
      `${plans}/${draftId}/assignInvigilators`,
      z.array(examEntryDraftSchema),
      'Aufsichten konnten nicht eingeteilt werden',
      json('POST', rooms)
    )
    getExamEntries(draftId).set(entries)
    await getExamPlan(draftId).refresh()
    return entries
  }
)

export const deleteExamEntry = command(draftEntrySchema, async ({ draftId, id }) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(
    fetch,
    `${plans}/${draftId}/examEntries/${id}`,
    'Termin konnte nicht gelöscht werden',
    { method: 'DELETE' }
  )
  await getExamPlan(draftId).refresh()
})

/** Labels and options for phases, RPO assessment methods, persons, rooms with an exam capacity and study programs. */
export const getExamPlanningLabels = query(async () => {
  const { fetch } = getRequestEvent()
  const [examPhases, assessmentMethods, identities, rooms, studyPrograms] = await Promise.all([
    fetchBackendJson(fetch, '/api/examPhases', examPlanningLabelSchemas.examPhases, labelError),
    fetchBackendJson(
      fetch,
      '/api/assessmentMethods?source=rpo',
      examPlanningLabelSchemas.assessmentMethods,
      labelError
    ),
    fetchBackendJson(fetch, '/api/identities', examPlanningLabelSchemas.identities, labelError),
    fetchBackendJson(
      fetch,
      '/api/rooms?examCapacityOnly=true',
      examPlanningLabelSchemas.rooms,
      labelError
    ),
    fetchBackendJson(
      fetch,
      '/api/studyPrograms?filter=not-expired',
      examPlanningLabelSchemas.studyPrograms,
      labelError
    )
  ])
  return {
    examPhases: examPhases.filter((p) => p.id !== 'none'),
    assessmentMethods,
    identities,
    persons: identities.flatMap((i) => ('firstname' in i ? [i] : [])),
    rooms,
    studyPrograms
  }
})
