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
import type { ScheduleEntry, SemesterPlanEntry } from '$lib/types/schedule'
import type { Cookies } from '@sveltejs/kit'
import { error } from '@sveltejs/kit'

export type HolidaysForCalendar = {
  timeGrid: CalendarEvent<HolidayEventProps>[]
  monthBg: CalendarEvent<HolidayEventProps>[]
}

export async function fetchHolidays(fetch: typeof globalThis.fetch): Promise<HolidaysForCalendar> {
  const resp = await fetch('/api/holidays')

  if (!resp.ok) {
    const err = await resp.json()
    throw error(resp.status, { message: `Fehler beim Laden der Feiertage: ${err.message}` })
  }

  const data: { date: string; label: string }[] = await resp.json()

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
