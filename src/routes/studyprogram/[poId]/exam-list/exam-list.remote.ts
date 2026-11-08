import { command, getRequestEvent, query } from '$app/server'
import { error } from '@sveltejs/kit'
import { z } from 'zod/v4'
import {
  examListConfigOptionsSchema,
  examListConfigSchema,
  examListLabelSchemas
} from '$lib/schemas/exam-list'
import { semesterSchema } from '$lib/schemas/semester'
import { artifactTargetSchema } from '$lib/schemas/study-program-artifacts'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { getStudyProgramManagement, getStudyProgramPrivileges } from '../../studyprogram.remote'

const labelError = 'Stammdaten konnten nicht geladen werden'

/** Study program, candidates, selectable semesters and the labels of the ids used by the candidates. */
export const getExamListOptions = query(artifactTargetSchema, async (po) => {
  const { fetch } = getRequestEvent()
  const [privileges, { modules }, semesters, identities, assessmentMethods, examPhases] =
    await Promise.all([
      getStudyProgramPrivileges(),
      fetchBackendJson(
        fetch,
        `/auth-api/examLists/configOptions/${encodeURIComponent(po)}`,
        examListConfigOptionsSchema,
        'Module der Prüfungsliste konnten nicht geladen werden'
      ),
      fetchBackendJson(
        fetch,
        '/api/examLists/semesters',
        z.array(semesterSchema),
        'Semester konnten nicht geladen werden'
      ),
      fetchBackendJson(fetch, '/api/identities', examListLabelSchemas.identities, labelError),
      fetchBackendJson(
        fetch,
        '/api/assessmentMethods',
        examListLabelSchemas.assessmentMethods,
        labelError
      ),
      fetchBackendJson(fetch, '/api/examPhases', examListLabelSchemas.examPhases, labelError)
    ])
  const matching = privileges.filter((privilege) => privilege.studyProgram.po.id === po)
  if (!matching.length) error(404, 'Studiengang wurde nicht gefunden')
  return {
    studyProgram: matching[0].studyProgram,
    canCreate: matching.some((p) => p.canCreate),
    modules,
    semesters,
    labels: { identities, assessmentMethods, examPhases }
  }
})

/** Stored configuration of the PO, or `null` if none has been saved yet. */
export const getExamListConfig = query(artifactTargetSchema, async (po) => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    `/auth-api/examLists/config/${encodeURIComponent(po)}`,
    examListConfigSchema.nullable(),
    'Konfiguration der Prüfungsliste konnte nicht geladen werden'
  )
})

const configRequestSchema = z.object({ po: artifactTargetSchema, config: examListConfigSchema })

export const saveExamListConfig = command(configRequestSchema, async ({ po, config }) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(
    fetch,
    `/auth-api/examLists/config/${encodeURIComponent(po)}`,
    'Konfiguration konnte nicht gespeichert werden',
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) }
  )
  await getExamListConfig(po).refresh()
})

/** Publishes the list for the semester of the configuration without saving the configuration. */
export const publishExamList = command(configRequestSchema, async ({ po, config }) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(
    fetch,
    `/auth-api/examLists/${encodeURIComponent(po)}`,
    'Freigabe der Prüfungsliste fehlgeschlagen',
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) }
  )
  await getStudyProgramManagement().refresh()
})
