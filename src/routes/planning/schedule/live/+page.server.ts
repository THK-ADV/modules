import {
  fetchHolidays,
  fetchSemesterEntries,
  getCalendarCookies
} from '$lib/server/backend/calendar'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
  const { userInfo } = await parent()

  if (!userInfo?.hasSchedulePlanningPrivileges) {
    throw error(403, { message: 'Keine Berechtigung für die Stundenplanung' })
  }

  const [holidays, semesterEntries] = await Promise.all([
    fetchHolidays(fetch),
    fetchSemesterEntries(fetch)
  ])

  const { timeGrid, monthBg } = holidays
  const { selectedCalendarView, selectedCalendarDate } = getCalendarCookies(cookies)

  return {
    holidays: timeGrid,
    holidaysMonth: monthBg,
    semesterEntries,
    selectedCalendarView,
    selectedCalendarDate
  }
}
