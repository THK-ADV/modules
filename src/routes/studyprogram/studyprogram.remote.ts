import { command, form, getRequestEvent, query } from '$app/server'
import { error } from '@sveltejs/kit'
import { z } from 'zod/v4'
import { examListReleaseRequestSchema } from '$lib/schemas/exam-list'
import { semesterSchema } from '$lib/schemas/semester'
import {
  artifactPreviewSchema,
  artifactTargetSchema,
  INTRODUCTION_FILE_TYPE,
  moduleCatalogIntroductionSchema,
  moduleCatalogRequestSchema,
  moduleCatalogUploadSchema,
  publishedDocumentSchema,
  studyProgramPrivilegeSchema,
  type StudyProgramManagerInfo
} from '$lib/schemas/study-program-artifacts'
import { fetchBackend, fetchBackendJson } from '$lib/server/backend/http'
import { fetchModuleCatalogConfigOptions } from '$lib/server/backend/module-catalog'

export const getStudyProgramPrivileges = query(async () => {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    '/auth-api/user-privileges',
    z.array(studyProgramPrivilegeSchema),
    'Berechtigungen konnten nicht geladen werden'
  )
})

export const getPublishedDocuments = query(
  z.enum(['moduleCatalogs', 'examLists']),
  async (kind) => {
    const { fetch } = getRequestEvent()
    return fetchBackendJson(
      fetch,
      `/api/${kind}`,
      z.array(publishedDocumentSchema),
      'Veröffentlichte Dokumente konnten nicht geladen werden'
    )
  }
)

export const getStudyProgramManagement = query(async () => {
  const { fetch } = getRequestEvent()
  const [privileges, semesters, examLists, moduleCatalogs, introductions] = await Promise.all([
    getStudyProgramPrivileges(),
    fetchBackendJson(
      fetch,
      '/api/examLists/semesters',
      z.array(semesterSchema),
      'Semester konnten nicht geladen werden'
    ),
    getPublishedDocuments('examLists'),
    getPublishedDocuments('moduleCatalogs'),
    fetchBackendJson(
      fetch,
      '/auth-api/moduleCatalogIntros',
      z.array(moduleCatalogIntroductionSchema),
      'Einleitungen konnten nicht geladen werden'
    )
  ])
  const examsByPO = new Map(examLists.map((document) => [document.studyProgram.po.id, document]))
  const catalogsByPO = new Map(
    moduleCatalogs.map((document) => [document.studyProgram.po.id, document])
  )
  const introsByPO = new Map(introductions.map((intro) => [intro.po, intro.lastModified]))
  const studyPrograms: StudyProgramManagerInfo[] = privileges.map((privilege) => ({
    ...privilege,
    examList: examsByPO.get(privilege.studyProgram.po.id),
    moduleCatalog: catalogsByPO.get(privilege.studyProgram.po.id),
    moduleCatalogIntroLastModified: introsByPO.get(privilege.studyProgram.po.id)
  }))
  studyPrograms.sort(
    ({ studyProgram: a }, { studyProgram: b }) =>
      a.id.localeCompare(b.id) ||
      a.degree.id.localeCompare(b.degree.id) ||
      a.po.version - b.po.version
  )
  return { studyPrograms, semesters }
})

export const getStudyProgram = query(artifactTargetSchema, async (po) => {
  const { fetch } = getRequestEvent()
  const [options, privileges] = await Promise.all([
    fetchModuleCatalogConfigOptions(fetch, po),
    getStudyProgramPrivileges()
  ])
  const matching = privileges.filter((privilege) => privilege.studyProgram.po.id === po)
  if (!matching.length) error(404, 'Studiengang wurde nicht gefunden')
  return {
    options,
    studyProgram: matching[0].studyProgram,
    canCreate: matching.some((p) => p.canCreate)
  }
})

export const previewArtifact = command(artifactPreviewSchema, async (input) => {
  const { fetch } = getRequestEvent()
  const po = encodeURIComponent(input.po)
  const isCatalog = input.document === 'moduleCatalog'
  const isCSV = input.document === 'examLoad'
  const contentType = isCSV ? 'text/csv' : 'application/pdf'
  const path = isCatalog
    ? `/moduleCatalogs/preview/${po}`
    : isCSV
      ? `/examLoad/${po}?preview=true`
      : `/examLists/preview/${po}`
  const response = await fetchBackend(
    fetch,
    `/auth-api${path}`,
    'Vorschau konnte nicht erzeugt werden',
    {
      method: isCatalog ? 'POST' : 'GET',
      headers: {
        Accept: contentType,
        ...(isCatalog ? { 'Content-Type': 'application/json' } : {})
      },
      body: isCatalog ? JSON.stringify(input.config) : undefined
    }
  )
  const mime = response.headers.get('Content-Type')?.split(';')[0].trim()
  if (mime !== contentType && !(isCSV && mime === 'text/plain')) {
    error(502, 'Die Vorschau hat ein ungültiges Dateiformat')
  }
  return {
    data: await response.arrayBuffer(),
    contentType,
    filename: `${input.document}-${input.po}.${isCSV ? 'csv' : 'pdf'}`
  }
})

export const publishModuleCatalog = command(moduleCatalogRequestSchema, async ({ po, config }) => {
  const { fetch } = getRequestEvent()
  await fetchBackend(
    fetch,
    `/auth-api/moduleCatalogs/${encodeURIComponent(po)}`,
    'Freigabe des Modulhandbuchs fehlgeschlagen',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }
  )
  await getStudyProgramManagement().refresh()
})

export const publishExamList = command(
  examListReleaseRequestSchema,
  async ({ po, semester, date }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(
      fetch,
      `/auth-api/examLists/${encodeURIComponent(po)}`,
      'Freigabe der Prüfungsliste fehlgeschlagen',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semester, date })
      }
    )
    await getStudyProgramManagement().refresh()
  }
)

export const uploadModuleCatalogIntroduction = form(
  moduleCatalogUploadSchema,
  async ({ po, file }) => {
    const { fetch } = getRequestEvent()
    await fetchBackend(
      fetch,
      `/auth-api/moduleCatalogIntros/${encodeURIComponent(po)}`,
      'Einleitung konnte nicht hochgeladen werden',
      {
        method: 'POST',
        headers: { 'Content-Type': INTRODUCTION_FILE_TYPE },
        body: file
      }
    )
    await getStudyProgramManagement().refresh()
    return { success: true }
  }
)
