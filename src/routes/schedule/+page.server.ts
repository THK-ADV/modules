import type { CalendarEvent, HolidayEventProps, SemesterPlanEventProps } from '$lib/calendar'
import {
  EVENT_SOURCE_COLORS,
  SELECTED_CALENDAR_DATE_COOKIE_NAME,
  SELECTED_CALENDAR_VIEW_COOKIE_NAME
} from '$lib/calendar/types'
import type { SemesterPlanEntry } from '$lib/types/schedule'
import { error, type HttpError } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

async function fetchHolidays(
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

async function fetchSemesterEntries(
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
        backgroundColor = EVENT_SOURCE_COLORS['semester-plan']
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
        source: 'semester-plan',
        type: entry.type,
        teachingUnit: entry.teachingUnit,
        semesterIndex: entry.semesterIndex
      }
    }
  })
}

export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const [holidaysRes, semesterEntriesRes] = await Promise.allSettled([
    fetchHolidays(fetch),
    fetchSemesterEntries(fetch)
  ])

  if (holidaysRes.status === 'rejected') {
    const err = (await holidaysRes.reason) as HttpError
    throw error(err.status, { message: err.body.message })
  }

  if (semesterEntriesRes.status === 'rejected') {
    const err = (await semesterEntriesRes.reason) as HttpError
    throw error(err.status, { message: err.body.message })
  }

  const selectedCalendarView = cookies.get(SELECTED_CALENDAR_VIEW_COOKIE_NAME)
  const selectedCalendarDate = cookies.get(SELECTED_CALENDAR_DATE_COOKIE_NAME)

  return {
    holidays: holidaysRes.value,
    semesterEntries: semesterEntriesRes.value,
    selectedCalendarView,
    selectedCalendarDate
  }
}
