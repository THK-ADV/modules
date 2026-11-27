import { getRequestEvent, query } from '$app/server'
import { createModuleFilterOptions } from '$lib/components/module-filter/types'
import { fmtPerson, peopleOrdering } from '$lib/formats'
import { examListLabelSchemas } from '$lib/schemas/exam-list'
import {
  genericModuleSchema,
  identityOptionSchema,
  labelOptionSchema,
  moduleCoreSchema
} from '$lib/schemas/module-options'
import { studyProgramSchema } from '$lib/schemas/study-program'
import { fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

function fetchList<Schema extends z.ZodType>(url: string, schema: Schema) {
  const { fetch } = getRequestEvent()
  return fetchBackendJson(
    fetch,
    url,
    z.array(schema),
    'Auswahloptionen konnten nicht geladen werden'
  )
}

/** Options of the module editor are optional: a list that fails to load stays empty. */
const orEmpty = <T>(list: Promise<T[]>) => list.catch((): T[] => [])

export const getGeneralOptions = query(async () => {
  const [moduleTypes, languages, seasons, locations, status] = await Promise.all(
    ['moduleTypes', 'languages', 'seasons', 'locations', 'status'].map((entity) =>
      orEmpty(fetchList(`/api/${entity}`, labelOptionSchema))
    )
  )
  return { moduleTypes, languages, seasons, locations, status }
})

/** All identities with their display label, persons first. */
export const getIdentityOptions = query(async () => {
  const identities = await orEmpty(fetchList('/api/identities', identityOptionSchema))
  return identities
    .sort(peopleOrdering)
    .map((identity) => ({ id: identity.id, kind: identity.kind, label: fmtPerson(identity) }))
})

/** Assessment methods, marked whether the RPO permits them, and exam phases. */
export const getExaminationOptions = query(async () => {
  const [assessmentMethods, examPhases] = await Promise.all([
    Promise.all([
      fetchList('/api/assessmentMethods', labelOptionSchema),
      fetchList('/api/assessmentMethods?source=rpo', labelOptionSchema)
    ])
      .then(([all, rpo]) =>
        all
          .map((m) => ({ ...m, isRPO: rpo.some(({ id }) => id === m.id) }))
          .sort((a, b) => a.deLabel.localeCompare(b.deLabel))
      )
      .catch(() => []),
    orEmpty(fetchList('/api/examPhases', examListLabelSchemas.examPhases.element))
  ])
  return {
    assessmentMethods,
    examPhases: examPhases.sort((a, b) => a.label.localeCompare(b.label))
  }
})

/** All modules as options to select prerequisites and related modules from. */
export const getModuleOptions = query(async () =>
  createModuleFilterOptions(await orEmpty(fetchList('/api/modules?source=all', moduleCoreSchema)))
)

/** Study programs that have not expired and the generic modules to assign elective modules to. */
export const getStudyProgramOptions = query(async () => {
  const [studyPrograms, genericModules] = await Promise.all([
    orEmpty(fetchList('/api/studyPrograms?filter=not-expired', studyProgramSchema)),
    orEmpty(fetchList('/api/modules?type=generic&source=all', genericModuleSchema))
  ])
  studyPrograms.sort(
    (a, b) =>
      a.deLabel.localeCompare(b.deLabel) ||
      a.degree.id.localeCompare(b.degree.id) ||
      a.po.version - b.po.version
  )
  genericModules.sort((a, b) => a.title.localeCompare(b.title))
  return { studyPrograms, genericModules }
})
