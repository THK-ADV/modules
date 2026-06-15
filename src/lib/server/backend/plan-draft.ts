import type { CalendarEvent, ScheduleEventProps } from '$lib/calendar'
import { COURSE_TYPE_COLORS } from '$lib/calendar/types'
import type {
  PlanDraft,
  PlanDraftCreate,
  PlanDraftKind,
  ScheduleEntryDraft,
  ScheduleEntryDraftPayload
} from '$lib/types/plan-draft'
import type { CourseType, ScheduleEntry, ScheduleEntryProps } from '$lib/types/schedule'
import type { Semester } from '$lib/types/semester'
import { fetchBackend, fetchBackendJson } from './http'

function createScheduleEvent(entry: ScheduleEntry): CalendarEvent<ScheduleEventProps> {
  const extendedProps: ScheduleEventProps = {
    source: 'schedule',
    raw: entry
  }
  return {
    id: entry.id,
    title: entry.moduleTitle,
    start: new Date(entry.start),
    end: new Date(entry.end),
    backgroundColor: COURSE_TYPE_COLORS[entry.courseType] + 'CC',
    extendedProps
  }
}

export function draftRawToScheduleEntry(draft: ScheduleEntryDraft): ScheduleEntry {
  const props: ScheduleEntryProps = {
    po: draft.po ?? [],
    lecturer: draft.lecturer.map(({ id }) => id)
  }

  return {
    id: draft.id,
    start: new Date(draft.start),
    end: new Date(draft.end),
    courseType: draft.courseType as CourseType,
    rooms: draft.rooms,
    module: draft.module,
    moduleTitle: draft.moduleTitle,
    moduleAbbrev: draft.moduleAbbrev,
    moduleManagement: draft.moduleManagement,
    lecturer: draft.lecturer,
    teachingUnits: draft.teachingUnits,
    props,
    seriesId: draft.seriesId
  }
}

export function scheduleEntryToDraftPayload(
  entry: {
    id?: string
    module: string
    courseType: CourseType
    start: Date
    end: Date
    rooms: string[]
    props: ScheduleEntryProps
  },
  planDraftId: string,
  seriesId: string
): ScheduleEntryDraftPayload {
  return {
    planDraft: planDraftId,
    seriesId,
    module: entry.module,
    courseType: entry.courseType,
    start: entry.start.toISOString(),
    end: entry.end.toISOString(),
    rooms: entry.rooms,
    lecturer: entry.props.lecturer,
    po: entry.props.po
  }
}

export function draftRawToCalendarEvents(
  drafts: ScheduleEntryDraft[]
): CalendarEvent<ScheduleEventProps>[] {
  return drafts.map((draft) => createScheduleEvent(draftRawToScheduleEntry(draft)))
}

/** Fetches the current and next semester */
export function fetchPlanningSemesters(fetch: typeof globalThis.fetch): Promise<Semester[]> {
  return fetchBackendJson(fetch, '/api/semesters', 'Fehler beim Laden der Semester')
}

/** Fetches the active plan drafts for the given kind */
export function fetchActivePlanDrafts(
  fetch: typeof globalThis.fetch,
  kind: PlanDraftKind
): Promise<PlanDraft[]> {
  return fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts?activeOnly=true&kind=${kind}`,
    'Fehler beim Laden laufender Planungsstände'
  )
}

/** Creates a new plan draft */
export async function createPlanDraft(
  fetch: typeof globalThis.fetch,
  payload: PlanDraftCreate
): Promise<void> {
  await fetchBackend(
    fetch,
    '/auth-api/schedulePlanDrafts',
    'Fehler beim Anlegen des Planungsstands',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
}

/** Deletes a plan draft */
export function deletePlanDraft(fetch: typeof globalThis.fetch, id: string): Promise<Response> {
  return fetchBackend(
    fetch,
    `/auth-api/schedulePlanDrafts/${id}`,
    'Fehler beim Löschen des Planungsstands',
    { method: 'DELETE' }
  )
}

/** Publishes a plan draft */
export async function publishPlanDraft(fetch: typeof globalThis.fetch, id: string): Promise<void> {
  await fetchBackend(
    fetch,
    `/auth-api/schedulePlanDrafts/${id}/publish`,
    'Fehler beim Veröffentlichen des Planungsstands',
    { method: 'POST' }
  )
}

/** Fetches the schedule entry drafts for a given plan draft */
export function fetchScheduleEntryDrafts(
  fetch: typeof globalThis.fetch,
  planDraftId: string
): Promise<ScheduleEntryDraft[]> {
  return fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts/${planDraftId}/scheduleEntries`,
    'Fehler beim Laden der Einträge des Planungsstands'
  )
}

/** Creates the schedule entry drafts for a given plan draft */
export async function createScheduleEntryDrafts(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  entries: ScheduleEntryDraftPayload[]
): Promise<void> {
  await fetchBackend(
    fetch,
    `/auth-api/schedulePlanDrafts/${planDraftId}/scheduleEntries`,
    'Fehler beim Erstellen der Einträge für den Planungsstand',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries)
    }
  )
}

/** Updates a schedule entry draft for a given plan draft */
export async function updateScheduleEntryDraft(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  entryId: string,
  entry: ScheduleEntryDraftPayload
): Promise<void> {
  await fetchBackend(
    fetch,
    `/auth-api/schedulePlanDrafts/${planDraftId}/scheduleEntries/${entryId}`,
    'Fehler beim Aktualisieren des Eintrags für den Planungsstand',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }
  )
}

/** Deletes a schedule entry draft for a given plan draft */
export async function deleteScheduleEntryDraft(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  entryId: string
): Promise<void> {
  await fetchBackend(
    fetch,
    `/auth-api/schedulePlanDrafts/${planDraftId}/scheduleEntries/${entryId}`,
    'Fehler beim Löschen des Eintrags für den Planungsstand',
    { method: 'DELETE' }
  )
}

/**
 * Filters the schedule entry drafts by range
 * TODO: this should be a backend function
 */
export function filterDraftEntriesByRange(
  entries: ScheduleEntryDraft[],
  startMs: string | null,
  endMs: string | null
): ScheduleEntryDraft[] {
  if (!startMs || !endMs) return entries
  const start = Number(startMs)
  const end = Number(endMs)
  return entries.filter((entry) => {
    const entryStart = new Date(entry.start).getTime()
    const entryEnd = new Date(entry.end).getTime()
    return entryStart < end && entryEnd > start
  })
}
