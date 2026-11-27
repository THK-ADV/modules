import { getRequestEvent, query } from '$app/server'
import { createModuleFilterOptions } from '$lib/components/module-filter/types'
import { fmtPerson, fmtPersonShort, peopleOrdering } from '$lib/formats'
import {
  identityOptionSchema,
  labelOptionSchema,
  moduleCoreSchema,
  roomOptionSchema,
  teachingUnitOptionSchema
} from '$lib/schemas/module-options'
import { studyProgramSchema } from '$lib/schemas/study-program'
import { fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

/** Filter options are optional: a list that fails to load stays empty. */
function fetchOptions<Schema extends z.ZodType>(url: string, schema: Schema) {
  return fetchBackendJson(
    getRequestEvent().fetch,
    url,
    z.array(schema),
    'Filteroptionen konnten nicht geladen werden'
  ).catch(() => [])
}

async function fetchIdentities() {
  const identities = await fetchOptions('/api/identities', identityOptionSchema)
  return identities
    .toSorted(peopleOrdering)
    .map((i) => ({ id: i.id, label: fmtPerson(i), badge: fmtPersonShort(i) }))
}

/** Options of the module list filter in one request. */
export const getModuleFilterOptions = query(async () => {
  const [studyPrograms, identities, status] = await Promise.all([
    fetchOptions('/api/studyPrograms?filter=currently-active', studyProgramSchema),
    fetchIdentities(),
    fetchOptions('/api/status', labelOptionSchema)
  ])
  return {
    studyPrograms,
    identities,
    moduleStatus: status.map((s) => ({ id: s.id, label: s.deLabel, badge: s.deLabel }))
  }
})

/** Options of the calendar filter in one request; planning (`spf`) includes all unexpired POs. */
export const getScheduleFilterOptions = query(z.enum(['sf', 'spf']), async (prefix) => {
  const [teachingUnits, modules, studyPrograms, identities, rooms] = await Promise.all([
    fetchOptions('/api/teachingUnits', teachingUnitOptionSchema),
    fetchOptions('/api/modules?source=live', moduleCoreSchema),
    fetchOptions(
      `/api/studyPrograms?filter=${prefix === 'spf' ? 'not-expired' : 'currently-active'}`,
      studyProgramSchema
    ),
    fetchIdentities(),
    fetchOptions('/api/rooms', roomOptionSchema)
  ])
  return {
    teachingUnits: teachingUnits.map((tu) => ({
      id: tu.id,
      label: tu.label,
      badge: tu.label.slice(0, 3).toUpperCase()
    })),
    modules: createModuleFilterOptions(modules),
    studyPrograms,
    identities,
    rooms: rooms.map((r) => ({ id: r.id, label: r.abbrev, badge: r.abbrev }))
  }
})
