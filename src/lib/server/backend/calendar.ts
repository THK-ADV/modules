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
import type {
  ScheduleEntry,
  ScheduleEntryCreate,
  ScheduleEntryEdit,
  SemesterPlanEntry
} from '$lib/types/schedule'
import { error } from '@sveltejs/kit'
import type { Cookies } from '@sveltejs/kit'
import { fetchBackend, fetchBackendJson } from './http'

/**
 * Converts a date string to an ISO 8601 string with the local timezone offset.
 * Unlike `Date.toISOString()`, which always returns UTC, this preserves
 * the local wall-clock time (e.g. "2026-04-22T09:00:00+02:00").
 */
export function toLocalISOString(date: Date): string {
  const off = -date.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  const offsetStr = `${sign}${pad(Math.floor(off / 60))}:${pad(off % 60)}`

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':00' +
    offsetStr
  )
}

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

function createScheduleEvents(entries: ScheduleEntry[]): CalendarEvent<ScheduleEventProps>[] {
  return entries.map((entry) => createScheduleEvent(entry))
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

  const entries = await fetchBackendJson<ScheduleEntry[]>(
    fetch,
    uri,
    'Fehler beim Laden des Stundenplans',
    { headers }
  )
  console.log(entries.length)

  return createScheduleEvents(entries)
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

  const entries = await fetchBackendJson<ScheduleEntry[]>(
    fetch,
    `/api/scheduleEntries?semester=${semester}`,
    'Fehler beim Laden des Stundenplans',
    { headers }
  )
  return createScheduleEvents(entries)
}

type ScheduleEntryWritePayload = Omit<ScheduleEntryEdit, 'id' | 'start' | 'end'> & {
  start: string
  end: string
}

function scheduleEntryCreateToPayload(entry: ScheduleEntryCreate): ScheduleEntryWritePayload {
  return {
    module: entry.module,
    courseType: entry.courseType,
    rooms: entry.rooms,
    props: entry.props,
    seriesId: entry.seriesId,
    start: toLocalISOString(new Date(entry.start)),
    end: toLocalISOString(new Date(entry.end))
  }
}

function scheduleEntryEditToPayload(entry: ScheduleEntryEdit): ScheduleEntryWritePayload {
  const { id: _id, ...rest } = entry
  return scheduleEntryCreateToPayload(rest)
}

export async function updateScheduleEntry(
  fetch: typeof globalThis.fetch,
  id: string,
  entry: ScheduleEntryWritePayload
): Promise<CalendarEvent<ScheduleEventProps>> {
  const updatedEntry = await fetchBackendJson<ScheduleEntry[]>(
    fetch,
    `/auth-api/scheduleEntries/${id}`,
    'Fehler beim Aktualisieren des Stundenplans',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }
  )
  return createScheduleEvent(updatedEntry[0])
}

export async function createScheduleEntriesFromInput(
  fetch: typeof globalThis.fetch,
  entries: ScheduleEntryCreate[]
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const body = JSON.stringify(entries.map(scheduleEntryCreateToPayload))
  return createScheduleEntries(fetch, body)
}

export async function updateScheduleEntryFromInput(
  fetch: typeof globalThis.fetch,
  entry: ScheduleEntryEdit
): Promise<CalendarEvent<ScheduleEventProps>> {
  return updateScheduleEntry(fetch, entry.id, scheduleEntryEditToPayload(entry))
}

export async function deleteScheduleEntry(
  fetch: typeof globalThis.fetch,
  id: string
): Promise<void> {
  await fetchBackend(fetch, `/auth-api/scheduleEntries/${id}`, 'Fehler beim Löschen des Eintrags', {
    method: 'DELETE'
  })
}

export async function createScheduleEntries(
  fetch: typeof globalThis.fetch,
  body: string
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const createdEntries = await fetchBackendJson<ScheduleEntry[]>(
    fetch,
    '/auth-api/scheduleEntries',
    'Fehler beim Erstellen der Einträge',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    }
  )
  return createScheduleEvents(createdEntries)
}

export function getCalendarCookies(cookies: Cookies) {
  return {
    selectedCalendarView: cookies.get(SELECTED_CALENDAR_VIEW_COOKIE_NAME),
    selectedCalendarDate: cookies.get(SELECTED_CALENDAR_DATE_COOKIE_NAME)
  }
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
