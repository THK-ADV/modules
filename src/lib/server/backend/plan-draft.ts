import type { CalendarEvent, ScheduleEventProps } from '$lib/calendar'
import {
  createPlanDraftInputSchema,
  planDraftResponseSchema,
  planDraftWithSemesterResponseSchema,
  semesterResponseSchema
} from '$lib/schemas/plan-draft'
import {
  createDraftScheduleEntriesInputSchema,
  deleteDraftScheduleEntryInputSchema,
  fetchDraftScheduleEntrySeriesInputSchema,
  fetchDraftScheduleEntriesInputSchema,
  nonEmptyScheduleEntryListResponseSchema,
  scheduleEntryListResponseSchema,
  scheduleSeriesOccurrenceListResponseSchema,
  updateDraftScheduleEntryInputSchema
} from '$lib/schemas/schedule'
import {
  PLAN_DRAFT_KINDS,
  type PlanDraft,
  type PlanDraftCreate,
  type PlanDraftKind
} from '$lib/types/plan-draft'
import type { ScheduleEntryCreate, ScheduleEntryEdit, SeriesOccurrence } from '$lib/types/schedule'
import type { Semester } from '$lib/types/semester'
import { z } from 'zod/v4'
import { fetchBackend, fetchBackendJson, parseBackendRequestInput } from './http'
import { toScheduleEvent, toScheduleEntryWriteRequest, toScheduleEvents } from './schedule-entry'

/** Fetches the current and next semester */
export async function fetchPlanningSemesters(fetch: typeof globalThis.fetch): Promise<Semester[]> {
  return fetchBackendJson(
    fetch,
    '/api/semesters',
    z.array(semesterResponseSchema),
    'Fehler beim Laden der Semester'
  )
}

/** Fetches the active plan drafts for the given kind */
export function fetchActivePlanDrafts(
  fetch: typeof globalThis.fetch,
  kind: PlanDraftKind
): Promise<PlanDraft[]> {
  const parsedKind = parseBackendRequestInput(
    z.enum(PLAN_DRAFT_KINDS),
    kind,
    'Ungültige Planungsstand-Art'
  )
  const params = new URLSearchParams({ activeOnly: 'true', kind: parsedKind })
  return fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts?${params}`,
    z.array(planDraftResponseSchema),
    'Fehler beim Laden laufender Planungsstände'
  )
}

/** Fetches a plan draft for the given kind */
export async function fetchPlanDraft(
  fetch: typeof globalThis.fetch,
  id: string,
  kind: PlanDraftKind
): Promise<{ planDraft: PlanDraft; semester: Semester }> {
  const planDraftId = parseBackendRequestInput(
    z.string().trim().min(1),
    id,
    'Ungültige Planungsstand-ID'
  )
  const parsedKind = parseBackendRequestInput(
    z.enum(PLAN_DRAFT_KINDS),
    kind,
    'Ungültige Planungsstand-Art'
  )
  const params = new URLSearchParams({ kind: parsedKind })
  return fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(planDraftId)}?${params}`,
    planDraftWithSemesterResponseSchema,
    'Fehler beim Laden des Planungsstands'
  )
}

/** Creates a new plan draft */
export async function createPlanDraft(
  fetch: typeof globalThis.fetch,
  payload: PlanDraftCreate
): Promise<void> {
  const parsedPayload = parseBackendRequestInput(
    createPlanDraftInputSchema,
    payload,
    'Ungültiger Planungsstand'
  )
  await fetchBackend(
    fetch,
    '/auth-api/schedulePlanDrafts',
    'Fehler beim Anlegen des Planungsstands',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedPayload)
    }
  )
}

/** Deletes a plan draft */
export async function deletePlanDraft(fetch: typeof globalThis.fetch, id: string): Promise<void> {
  const planDraftId = parseBackendRequestInput(
    z.string().trim().min(1),
    id,
    'Ungültige Planungsstand-ID'
  )
  await fetchBackend(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(planDraftId)}`,
    'Fehler beim Löschen des Planungsstands',
    { method: 'DELETE' }
  )
}

/** Publishes a plan draft */
export async function publishPlanDraft(fetch: typeof globalThis.fetch, id: string): Promise<void> {
  const planDraftId = parseBackendRequestInput(
    z.string().trim().min(1),
    id,
    'Ungültige Planungsstand-ID'
  )
  await fetchBackend(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(planDraftId)}/publish`,
    'Fehler beim Veröffentlichen des Planungsstands',
    { method: 'POST' }
  )
}

/** Fetches schedule entries for a plan draft and date range. */
export async function fetchScheduleEntryDraftsByRange(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  start: number,
  end: number,
  bypassCache: boolean
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const input = parseBackendRequestInput(
    fetchDraftScheduleEntriesInputSchema,
    { draftId: planDraftId, range: { start, end, bypassCache } },
    'Ungültige Abfrage für Planungsstand-Einträge'
  )
  const headers: HeadersInit = {}
  if (input.range.bypassCache) {
    headers['Cache-Control'] = 'no-cache'
  }

  const params = new URLSearchParams({
    from: String(input.range.start),
    to: String(input.range.end)
  })
  const entries = await fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(input.draftId)}/scheduleEntries?${params}`,
    scheduleEntryListResponseSchema,
    'Fehler beim Laden der Einträge des Planungsstands',
    { headers }
  )
  return toScheduleEvents(entries)
}

/** Fetches the occurrences belonging to a series within a plan draft. */
export async function fetchScheduleEntryDraftSeriesOccurrences(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  seriesId: string
): Promise<SeriesOccurrence[]> {
  const input = parseBackendRequestInput(
    fetchDraftScheduleEntrySeriesInputSchema,
    { draftId: planDraftId, seriesId },
    'Ungültige Abfrage für Planungsstand-Terminreihe'
  )
  return fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(input.draftId)}/scheduleEntries/series/${encodeURIComponent(input.seriesId)}/occurrences`,
    scheduleSeriesOccurrenceListResponseSchema,
    'Fehler beim Laden der Serientermine des Planungsstands'
  )
}

/** Creates schedule entries within a plan draft. */
export async function createScheduleEntryDrafts(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  entries: ScheduleEntryCreate[]
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const input = parseBackendRequestInput(
    createDraftScheduleEntriesInputSchema,
    { draftId: planDraftId, entries },
    'Ungültige Planungsstand-Einträge'
  )
  const payload = input.entries.map(toScheduleEntryWriteRequest)
  const createdEntries = await fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(input.draftId)}/scheduleEntries`,
    nonEmptyScheduleEntryListResponseSchema,
    'Fehler beim Erstellen der Einträge für den Planungsstand',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return toScheduleEvents(createdEntries)
}

/** Updates one schedule entry within a plan draft. */
export async function updateScheduleEntryDraft(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  entry: ScheduleEntryEdit
): Promise<CalendarEvent<ScheduleEventProps>> {
  const input = parseBackendRequestInput(
    updateDraftScheduleEntryInputSchema,
    { draftId: planDraftId, entry },
    'Ungültiger Planungsstand-Eintrag'
  )
  const payload = toScheduleEntryWriteRequest(input.entry)
  const updatedEntries = await fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(input.draftId)}/scheduleEntries/${encodeURIComponent(input.entry.id)}`,
    nonEmptyScheduleEntryListResponseSchema,
    'Fehler beim Aktualisieren des Eintrags für den Planungsstand',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return toScheduleEvent(updatedEntries[0])
}

/** Updates every schedule entry in the same series within a plan draft. */
export async function updateScheduleEntryDraftSeries(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  entry: ScheduleEntryEdit
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const input = parseBackendRequestInput(
    updateDraftScheduleEntryInputSchema,
    { draftId: planDraftId, entry },
    'Ungültiger Planungsstand-Eintrag'
  )
  const payload = toScheduleEntryWriteRequest(input.entry)
  const updatedEntries = await fetchBackendJson(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(input.draftId)}/scheduleEntries/${encodeURIComponent(input.entry.id)}/series`,
    nonEmptyScheduleEntryListResponseSchema,
    'Fehler beim Aktualisieren der Terminreihe des Planungsstands',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return toScheduleEvents(updatedEntries)
}

/** Deletes a schedule entry within a plan draft. */
export async function deleteScheduleEntryDraft(
  fetch: typeof globalThis.fetch,
  planDraftId: string,
  entryId: string
): Promise<void> {
  const input = parseBackendRequestInput(
    deleteDraftScheduleEntryInputSchema,
    { draftId: planDraftId, id: entryId },
    'Ungültiger Planungsstand-Eintrag'
  )
  await fetchBackend(
    fetch,
    `/auth-api/schedulePlanDrafts/${encodeURIComponent(input.draftId)}/scheduleEntries/${encodeURIComponent(input.id)}`,
    'Fehler beim Löschen des Eintrags für den Planungsstand',
    { method: 'DELETE' }
  )
}
