import { loadCurrentSemesterBookings } from '$lib/server/backend/booking'
import {
  fetchHolidays,
  fetchSemesterEntries,
  getCalendarCookies
} from '$lib/server/backend/calendar'
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, cookies, parent }) => {
  const { user, userInfo } = await parent()

  if (userInfo?.hasSchedulePlanningPrivileges) {
    redirect(303, '/planning/schedule')
  }

  if (!userInfo?.hasScheduleBookingPrivileges) {
    throw error(403, { message: 'Keine Berechtigung für Einzelbuchungen' })
  }

  const [holidays, semesterEntries, bookingData] = await Promise.all([
    fetchHolidays(fetch),
    fetchSemesterEntries(fetch),
    loadCurrentSemesterBookings(fetch, user, true)
  ])

  const { timeGrid, monthBg } = holidays
  const { selectedCalendarView, selectedCalendarDate } = getCalendarCookies(cookies)

  return {
    holidays: timeGrid,
    holidaysMonth: monthBg,
    semesterEntries,
    ...bookingData,
    selectedCalendarView,
    selectedCalendarDate
  }
}
