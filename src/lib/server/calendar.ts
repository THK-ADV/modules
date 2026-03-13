import type {
  CalendarEvent,
  HolidayEventProps,
  ScheduleEventProps,
  SemesterPlanEventProps
} from '$lib/calendar'
import {
  EVENT_SOURCE_COLORS,
  SELECTED_CALENDAR_DATE_COOKIE_NAME,
  SELECTED_CALENDAR_VIEW_COOKIE_NAME
} from '$lib/calendar/types'
import type { ScheduleEntry, SemesterPlanEntry } from '$lib/types/schedule'
import type { Cookies } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'

export async function fetchHolidays(
  fetch: typeof globalThis.fetch
): Promise<CalendarEvent<HolidayEventProps>[]> {
  const resp = await fetch('/api/holidays')

  if (!resp.ok) {
    const err = await resp.json()
    throw error(resp.status, { message: `Fehler beim Laden der Feiertage: ${err.message}` })
  }

  const data: { date: string; label: string }[] = await resp.json()

  return data.map(({ date, label }) => ({
    id: `${date}-${label}`,
    title: label,
    start: date,
    allDay: true,
    backgroundColor: EVENT_SOURCE_COLORS['holiday'],
    extendedProps: { source: 'holiday' }
  }))
}

export async function fetchSemesterEntries(
  fetch: typeof globalThis.fetch
): Promise<CalendarEvent<SemesterPlanEventProps>[]> {
  const resp = await fetch('/api/semesterPlan')

  if (!resp.ok) {
    const err = await resp.json()
    throw error(resp.status, { message: `Fehler beim Laden des Semesterplans: ${err.message}` })
  }

  const entries: SemesterPlanEntry[] = await resp.json()

  return entries.map((entry) => {
    let title: string
    let backgroundColor: string

    switch (entry.type) {
      case 'lecture': {
        title = 'Vorlesung'
        backgroundColor = EVENT_SOURCE_COLORS['semesterPlan']
        break
      }
      case 'exam': {
        title = 'Prüfung'
        backgroundColor = EVENT_SOURCE_COLORS['exam']
        break
      }
      case 'block': {
        title = 'Block'
        backgroundColor = '#daa520'
        break
      }
      case 'project': {
        title = 'Projekt'
        backgroundColor = '#daa520'
        break
      }
      case 'closed_building': {
        title = 'Gebäude geschlossen'
        backgroundColor = EVENT_SOURCE_COLORS['holiday']
        break
      }
      case 'self_study': {
        title = 'Selbstlernphase'
        backgroundColor = '#8b7d6b'
        break
      }
      default: {
        title = 'Unbekannt'
        backgroundColor = '#000000'
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
      backgroundColor,
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
    backgroundColor: EVENT_SOURCE_COLORS['schedule'],
    extendedProps
  }
}

function createScheduleEvents(entries: ScheduleEntry[]): CalendarEvent<ScheduleEventProps>[] {
  return entries.map((entry) => createScheduleEvent(entry))
}

export async function fetchScheduleEntriesByRange(
  fetch: typeof globalThis.fetch,
  start: string | null,
  end: string | null,
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

  const resp = await fetch(uri, { headers })

  if (!resp.ok) {
    const err = await resp.json()
    throw error(resp.status, {
      message: `Fehler beim Laden des Stundenplans: ${err.message}`
    })
  }

  const entries: ScheduleEntry[] = await resp.json()
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

  const resp = await fetch(`/api/scheduleEntries?semester=${semester}`, { headers })

  if (!resp.ok) {
    const err = await resp.json()
    throw error(resp.status, {
      message: `Fehler beim Laden des Stundenplans: ${err.message}`
    })
  }

  const entries: ScheduleEntry[] = await resp.json()
  return createScheduleEvents(entries)
}

export async function updateScheduleEntry(
  fetch: typeof globalThis.fetch,
  id: string,
  entry: ScheduleEntry
): Promise<CalendarEvent<ScheduleEventProps>> {
  const resp = await fetch(`/auth-api/scheduleEntries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  })

  if (!resp.ok) {
    const err = await resp.json()
    throw error(resp.status, {
      message: `Fehler beim Aktualisieren des Stundenplans: ${err.message}`
    })
  }

  const updatedEntry: ScheduleEntry[] = await resp.json()
  return createScheduleEvent(updatedEntry[0])
}

export async function createScheduleEntries(
  fetch: typeof globalThis.fetch,
  body: string
): Promise<CalendarEvent<ScheduleEventProps>[]> {
  const resp = await fetch('/auth-api/scheduleEntries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ message: resp.statusText }))
    throw error(resp.status, {
      message: `Fehler beim Erstellen der Einträge: ${err.message}`
    })
  }

  const createdEntries: ScheduleEntry[] = await resp.json()
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
  const resp = await fetch(`/api/modules/${module}?select=lecturers`)
  if (!resp.ok) {
    const err = await resp.json()
    throw error(resp.status, { message: `Fehler beim Laden der Lehrkräfte: ${err.message}` })
  }
  const ids: string[] = await resp.json()
  return ids
}
