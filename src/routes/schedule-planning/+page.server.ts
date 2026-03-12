import { fetchHolidays, fetchSemesterEntries, getCalendarCookies } from '$lib/server/calendar'
import { error, type HttpError } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

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

  const { selectedCalendarView, selectedCalendarDate } = getCalendarCookies(cookies)

  return {
    holidays: holidaysRes.value,
    semesterEntries: semesterEntriesRes.value,
    selectedCalendarView,
    selectedCalendarDate
  }
}
