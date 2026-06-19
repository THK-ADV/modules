import type {
  CalendarEvent,
  HolidayEventProps,
  ScheduleEventProps,
  SemesterPlanEventProps
} from '$lib/calendar'
import {
  SELECTED_CALENDAR_DATE_COOKIE_NAME,
  SELECTED_CALENDAR_VIEW_COOKIE_NAME,
  CALENDAR_VISIBLE_DAY_END,
  CALENDAR_VISIBLE_DAY_START,
  SEMESTER_PLAN_TYPE_COLORS
} from '$lib/calendar/types'
import {
  calendarHolidayListResponseSchema,
  createScheduleEntriesInputSchema,
  nonEmptyScheduleEntryListResponseSchema,
  scheduleEntriesRangeInputSchema,
  scheduleEntryListResponseSchema,
  scheduleLecturerOptionListResponseSchema,
  schedulePoOptionListResponseSchema,
  scheduleSeriesOccurrenceListResponseSchema,
  semesterPlanEntryListResponseSchema,
  updateScheduleEntryInputSchema
} from '$lib/schemas/schedule'
import type {
  PO,
  ScheduleEntryCreate,
  ScheduleEntryEdit,
  SemesterPlanEntry,
  SeriesOccurrence
} from '$lib/types/schedule'
import type { Cookies } from '@sveltejs/kit'
import { z } from 'zod/v4'
import { fetchBackend, fetchBackendJson, parseBackendRequestInput } from './http'
import { toScheduleEvent, toScheduleEntryWriteRequest, toScheduleEvents } from './schedule-entry'

// Backend API functions

export type HolidaysForCalendar = {
  timeGrid: CalendarEvent<HolidayEventProps>[]
  monthBg: CalendarEvent<HolidayEventProps>[]
}

export async function fetchHolidays(fetch: typeof globalThis.fetch): Promise<HolidaysForCalendar> {
  const data = await fetchBackendJson(
    fetch,
    '/api/holidays',
    calendarHolidayListResponseSchema,
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
  const entries: SemesterPlanEntry[] = await fetchBackendJson(
    fetch,
    '/api/semesterPlan',
    semesterPlanEntryListResponseSchema,
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
  start: number,
  end: number,
  bypassCache: boolean
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const input = parseBackendRequestInput(
    scheduleEntriesRangeInputSchema,
    { start, end, bypassCache },
    'Ungültiger Stundenplan-Zeitraum'
  )
  const params = new URLSearchParams({
    from: String(input.start),
    to: String(input.end)
  })

  const headers: HeadersInit = {}
  if (input.bypassCache) {
    headers['Cache-Control'] = 'no-cache'
  }

  const entries = await fetchBackendJson(
    fetch,
    `/api/scheduleEntries?${params}`,
    scheduleEntryListResponseSchema,
    'Fehler beim Laden des Stundenplans',
    { headers }
  )
  return toScheduleEvents(entries)
}

export async function fetchScheduleEntrySeriesOccurrences(
  fetch: typeof globalThis.fetch,
  seriesId: string
): Promise<SeriesOccurrence[]> {
  const parsedSeriesId = parseBackendRequestInput(
    z.string().trim().min(1),
    seriesId,
    'Ungültige Terminreihen-ID'
  )
  return fetchBackendJson(
    fetch,
    `/auth-api/scheduleEntries/series/${encodeURIComponent(parsedSeriesId)}/occurrences`,
    scheduleSeriesOccurrenceListResponseSchema,
    'Fehler beim Laden der Serientermine'
  )
}

export async function deleteScheduleEntry(
  fetch: typeof globalThis.fetch,
  id: string
): Promise<void> {
  const entryId = parseBackendRequestInput(z.string().trim().min(1), id, 'Ungültige Stundenplan-ID')
  await fetchBackend(
    fetch,
    `/auth-api/scheduleEntries/${encodeURIComponent(entryId)}`,
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
  const parsedEntries = parseBackendRequestInput(
    createScheduleEntriesInputSchema,
    entries,
    'Ungültige Stundenplan-Einträge'
  )
  const payload = parsedEntries.map(toScheduleEntryWriteRequest)
  const createdEntries = await fetchBackendJson(
    fetch,
    '/auth-api/scheduleEntries',
    nonEmptyScheduleEntryListResponseSchema,
    'Fehler beim Erstellen der Einträge',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return toScheduleEvents(createdEntries)
}

export async function updateScheduleEntry(
  fetch: typeof globalThis.fetch,
  entry: ScheduleEntryEdit
): Promise<CalendarEvent<ScheduleEventProps>> {
  const parsedEntry = parseBackendRequestInput(
    updateScheduleEntryInputSchema,
    entry,
    'Ungültiger Stundenplan-Eintrag'
  )
  const payload = toScheduleEntryWriteRequest(parsedEntry)
  const updatedEntries = await fetchBackendJson(
    fetch,
    `/auth-api/scheduleEntries/${encodeURIComponent(parsedEntry.id)}`,
    nonEmptyScheduleEntryListResponseSchema,
    'Fehler beim Aktualisieren des Eintrags',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return toScheduleEvent(updatedEntries[0])
}

export async function updateScheduleEntrySeries(
  fetch: typeof globalThis.fetch,
  entry: ScheduleEntryEdit
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const parsedEntry = parseBackendRequestInput(
    updateScheduleEntryInputSchema,
    entry,
    'Ungültiger Stundenplan-Eintrag'
  )
  const payload = toScheduleEntryWriteRequest(parsedEntry)
  const updatedEntries = await fetchBackendJson(
    fetch,
    `/auth-api/scheduleEntries/${encodeURIComponent(parsedEntry.id)}/series`,
    nonEmptyScheduleEntryListResponseSchema,
    'Fehler beim Aktualisieren der Terminreihe',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return toScheduleEvents(updatedEntries)
}

export async function fetchLecturerOptions(
  fetch: typeof globalThis.fetch,
  module: string
): Promise<string[]> {
  const moduleId = parseBackendRequestInput(z.string().trim().min(1), module, 'Ungültige Modul-ID')
  return fetchBackendJson(
    fetch,
    `/api/modules/${encodeURIComponent(moduleId)}?select=lecturers`,
    scheduleLecturerOptionListResponseSchema,
    'Fehler beim Laden der Lehrkräfte für das Modul'
  )
}

export async function fetchPOOptions(
  fetch: typeof globalThis.fetch,
  module: string
): Promise<PO[]> {
  const moduleId = parseBackendRequestInput(z.string().trim().min(1), module, 'Ungültige Modul-ID')
  return fetchBackendJson(
    fetch,
    `/api/modules/${encodeURIComponent(moduleId)}?select=pos`,
    schedulePoOptionListResponseSchema,
    'Fehler beim Laden der POs für das Modul'
  )
}

export function getCalendarCookies(cookies: Cookies) {
  return {
    selectedCalendarView: cookies.get(SELECTED_CALENDAR_VIEW_COOKIE_NAME),
    selectedCalendarDate: cookies.get(SELECTED_CALENDAR_DATE_COOKIE_NAME)
  }
}
