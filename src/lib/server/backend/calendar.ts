import type {
  CalendarEvent,
  HolidayEventProps,
  ScheduleEventProps,
  SemesterPlanEventProps
} from '$lib/calendar'
import {
  CALENDAR_VISIBLE_DAY_END,
  CALENDAR_VISIBLE_DAY_START,
  COURSE_TYPE_COLORS,
  SELECTED_CALENDAR_DATE_COOKIE_NAME,
  SELECTED_CALENDAR_VIEW_COOKIE_NAME,
  SEMESTER_PLAN_TYPE_COLORS
} from '$lib/calendar/types'
import {
  createNonEmptyStringSchema,
  createScheduleEntryWritePayloadSchema,
  createSeriesOccurrenceSchema,
  createScheduleEntrySchema,
  type ScheduleEntryWritePayload
} from '$lib/schemas/schedule'
import type {
  ScheduleEntry,
  ScheduleEntryCreate,
  ScheduleEntryEdit,
  SeriesOccurrence,
  SemesterPlanEntry
} from '$lib/types/schedule'
import { error } from '@sveltejs/kit'
import type { Cookies } from '@sveltejs/kit'
import type { ZodType } from 'zod/v4'
import { fetchBackend, fetchBackendJson } from './http'
import { z } from 'zod/v4'

// Validation schemas

const INVALID_SCHEDULE_ENTRY_RESPONSE_MESSAGE = 'Backend lieferte ungültige Stundenplan-Daten'
const INVALID_SCHEDULE_ENTRY_INPUT_MESSAGE = 'Ungültige Eingabe für Stundenplan-Eintrag'

// Invalid backend JSON means the upstream API broke the contract expected by this frontend.
function parseBackendOutput<T>(schema: ZodType<T>, data: unknown, message: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error(message, result.error.issues)
    throw error(502, { message })
  }

  return result.data
}

// Invalid data produced before calling the backend is handled as a bad request to our API layer.
function parseApiInput<T>(schema: ZodType<T>, data: unknown, message: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    console.error(message, result.error.issues)
    throw error(400, { message })
  }

  return result.data
}

function parseScheduleEntries(data: unknown): ScheduleEntry[] {
  return parseBackendOutput(
    z.array(createScheduleEntrySchema()),
    data,
    INVALID_SCHEDULE_ENTRY_RESPONSE_MESSAGE
  )
}

function parseScheduleEntryWritePayload(
  entry: ScheduleEntryWritePayload
): ScheduleEntryWritePayload {
  return parseApiInput(
    createScheduleEntryWritePayloadSchema(),
    entry,
    INVALID_SCHEDULE_ENTRY_INPUT_MESSAGE
  )
}

function parseScheduleEntryId(id: string): string {
  return parseApiInput(createNonEmptyStringSchema(), id, 'Ungültige Stundenplan-ID')
}

function parseScheduleEntrySeriesId(seriesId: string): string {
  return parseApiInput(createNonEmptyStringSchema(), seriesId, 'Ungültige Terminreihen-ID')
}

function parseSeriesOccurrences(data: unknown): SeriesOccurrence[] {
  return parseBackendOutput(
    z.array(createSeriesOccurrenceSchema()),
    data,
    INVALID_SCHEDULE_ENTRY_RESPONSE_MESSAGE
  )
}

// UI Conversion functions

function toScheduleEvent(entry: ScheduleEntry): CalendarEvent<ScheduleEventProps> {
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

function toScheduleEvents(entries: ScheduleEntry[]): CalendarEvent<ScheduleEventProps>[] {
  return entries.map((entry) => toScheduleEvent(entry))
}

// Payload conversion functions

function scheduleEntryCreateToPayload(entry: ScheduleEntryCreate): ScheduleEntryWritePayload {
  return parseScheduleEntryWritePayload({
    module: entry.module,
    courseType: entry.courseType,
    rooms: entry.rooms,
    props: entry.props,
    seriesId: entry.seriesId,
    start: new Date(entry.start).toISOString(),
    end: new Date(entry.end).toISOString()
  })
}

function scheduleEntryEditToPayload(entry: ScheduleEntryEdit): ScheduleEntryWritePayload {
  return scheduleEntryCreateToPayload(entry)
}

// Backend API functions

export type HolidaysForCalendar = {
  timeGrid: CalendarEvent<HolidayEventProps>[]
  monthBg: CalendarEvent<HolidayEventProps>[]
}

export async function fetchHolidays(fetch: typeof globalThis.fetch): Promise<HolidaysForCalendar> {
  const data = await fetchBackendJson<{ date: string; label: string }[]>(
    fetch,
    '/api/holidays',
    'Fehler beim Laden der Feiertage'
  )

  const timeGrid: CalendarEvent<HolidayEventProps>[] = []
  const monthBg: CalendarEvent<HolidayEventProps>[] = []

  for (const { date, label } of data) {
    const id = `${date}-${label}`
    const extendedProps: HolidayEventProps = { source: 'holiday' }

    timeGrid.push({
      id,
      title: label,
      start: `${date}T${CALENDAR_VISIBLE_DAY_START}`,
      end: `${date}T${CALENDAR_VISIBLE_DAY_END}`,
      allDay: false,
      display: 'background' as const,
      classNames: ['holiday-bg-event', 'holiday-bg-event--slots'],
      extendedProps
    })

    monthBg.push({
      id,
      title: label,
      start: date,
      allDay: true,
      display: 'background' as const,
      classNames: ['holiday-bg-event', 'holiday-bg-event--slots'],
      extendedProps
    })
  }

  return { timeGrid, monthBg }
}

/** Fetches the semester plan entries for the current semester */
export async function fetchSemesterEntries(
  fetch: typeof globalThis.fetch
): Promise<CalendarEvent<SemesterPlanEventProps>[]> {
  const entries = await fetchBackendJson<SemesterPlanEntry[]>(
    fetch,
    '/api/semesterPlan',
    'Fehler beim Laden des Semesterplans'
  )

  return entries.map((entry) => {
    let title: string

    switch (entry.type) {
      case 'lecture': {
        title = 'Vorlesung'
        break
      }
      case 'exam': {
        title = 'Prüfung'
        break
      }
      case 'block': {
        title = 'Block'
        break
      }
      case 'project': {
        title = 'Projekt'
        break
      }
      case 'closed_building': {
        title = 'Gebäude geschlossen'
        break
      }
      case 'self_study': {
        title = 'Selbstlernphase'
        break
      }
      case 'semester_break': {
        title = 'Vorlesungsfreie Zeit'
        break
      }
      default: {
        title = 'Unbekannt'
        break
      }
    }

    if (entry.teachingUnitLabel) {
      title += ` (${entry.teachingUnitLabel})`
    }

    if (entry.semesterIndex) {
      title += ` (${entry.semesterIndex.join(', ')})`
    }

    return {
      id: entry.id,
      title,
      start: entry.start,
      end: entry.end,
      allDay: true,
      backgroundColor: SEMESTER_PLAN_TYPE_COLORS[entry.type],
      extendedProps: {
        source: 'semesterPlan',
        type: entry.type,
        teachingUnit: entry.teachingUnit,
        semesterIndex: entry.semesterIndex
      }
    }
  })
}

/** Fetches the schedule entries for a given date range */
export async function fetchScheduleEntriesByRange(
  fetch: typeof globalThis.fetch,
  start: number | null,
  end: number | null,
  bypassCache: boolean
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  if (!start || !end) {
    throw error(400, { message: 'Start- und Enddatum sind erforderlich' })
  }

  const uri = `/api/scheduleEntries?from=${start}&to=${end}`

  const headers: HeadersInit = {}
  if (bypassCache) {
    headers['Cache-Control'] = 'no-cache'
  }

  const data = await fetchBackendJson<unknown>(fetch, uri, 'Fehler beim Laden des Stundenplans', {
    headers
  })
  const entries = parseScheduleEntries(data)
  return toScheduleEvents(entries)
}

export async function fetchScheduleEntriesBySemester(
  fetch: typeof globalThis.fetch,
  semester: string | null,
  bypassCache: boolean
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  if (!semester) {
    throw error(400, { message: 'Semester ist erforderlich' })
  }

  const headers: HeadersInit = {}
  if (bypassCache) {
    headers['Cache-Control'] = 'no-cache'
  }

  const data = await fetchBackendJson<unknown>(
    fetch,
    `/api/scheduleEntries?semester=${semester}`,
    'Fehler beim Laden des Stundenplans',
    { headers }
  )
  const entries = parseScheduleEntries(data)
  return toScheduleEvents(entries)
}

export async function scheduleEntrySeriesExists(
  fetch: typeof globalThis.fetch,
  seriesId: string
): Promise<SeriesOccurrence[] | null> {
  const parsedSeriesId = parseScheduleEntrySeriesId(seriesId)

  try {
    const res = await fetchBackend(
      fetch,
      `/auth-api/scheduleEntries/series/${parsedSeriesId}`,
      'Fehler beim Prüfen der Terminreihe'
    )
    return parseSeriesOccurrences(await res.json())
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'status' in err && err.status === 404) {
      return null
    }
    throw err
  }
}

export async function deleteScheduleEntry(
  fetch: typeof globalThis.fetch,
  id: string
): Promise<void> {
  const entryId = parseScheduleEntryId(id)
  await fetchBackend(
    fetch,
    `/auth-api/scheduleEntries/${entryId}`,
    'Fehler beim Löschen des Eintrags',
    {
      method: 'DELETE'
    }
  )
}

export async function createScheduleEntries(
  fetch: typeof globalThis.fetch,
  entries: ScheduleEntryCreate[]
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const payload = entries.map(scheduleEntryCreateToPayload)
  const data = await fetchBackendJson<unknown>(
    fetch,
    '/auth-api/scheduleEntries',
    'Fehler beim Erstellen der Einträge',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  const createdEntries = parseScheduleEntries(data)
  return toScheduleEvents(createdEntries)
}

export async function updateScheduleEntry(
  fetch: typeof globalThis.fetch,
  entry: ScheduleEntryEdit
): Promise<CalendarEvent<ScheduleEventProps>> {
  const entryId = parseScheduleEntryId(entry.id)
  const payload = scheduleEntryEditToPayload(entry)
  const data = await fetchBackendJson<unknown>(
    fetch,
    `/auth-api/scheduleEntries/${entryId}`,
    'Fehler beim Aktualisieren des Eintrags',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  const updatedEntry = parseScheduleEntries(data)
  return toScheduleEvent(updatedEntry[0])
}

export async function updateScheduleEntrySeries(
  fetch: typeof globalThis.fetch,
  entry: ScheduleEntryEdit
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const entryId = parseScheduleEntryId(entry.id)
  const payload = scheduleEntryEditToPayload(entry)
  const data = await fetchBackendJson<unknown>(
    fetch,
    `/auth-api/scheduleEntries/${entryId}/series`,
    'Fehler beim Aktualisieren der Terminreihe',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  const updatedEntries = parseScheduleEntries(data)
  return toScheduleEvents(updatedEntries)
}

export async function fetchLecturerOptions(
  fetch: typeof globalThis.fetch,
  module: string
): Promise<string[]> {
  return fetchBackendJson(
    fetch,
    `/api/modules/${module}?select=lecturers`,
    'Fehler beim Laden der Lehrkräfte'
  )
}

export function getCalendarCookies(cookies: Cookies) {
  return {
    selectedCalendarView: cookies.get(SELECTED_CALENDAR_VIEW_COOKIE_NAME),
    selectedCalendarDate: cookies.get(SELECTED_CALENDAR_DATE_COOKIE_NAME)
  }
}
