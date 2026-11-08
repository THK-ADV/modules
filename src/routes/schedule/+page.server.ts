import { bookingAccess } from '$lib/server/backend/booking'
import {
  fetchHolidays,
  fetchSemesterEntries,
  getCalendarCookies
} from '$lib/server/backend/calendar'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
  const { user } = await parent()

  const [holidays, semesterEntries] = await Promise.all([
    fetchHolidays(fetch),
    fetchSemesterEntries(fetch)
  ])

  const { selectedCalendarView, selectedCalendarDate } = getCalendarCookies(cookies)

  const { timeGrid, monthBg } = holidays

  return {
    holidays: timeGrid,
    holidaysMonth: monthBg,
    semesterEntries,
    ...bookingAccess(user),
    selectedCalendarView,
    selectedCalendarDate
  }
}
