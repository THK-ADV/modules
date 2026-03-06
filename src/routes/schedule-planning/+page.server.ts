import { fetchHolidays, fetchSemesterEntries, getCalendarCookies } from '$lib/server/calendar'
import { error, type HttpError } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import type { Semester } from '$lib/types/semester'

export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const [holidaysRes, semesterEntriesRes, semestersRes] = await Promise.allSettled([
    fetchHolidays(fetch),
    fetchSemesterEntries(fetch),
    fetch('/api/semesters')
  ])

  if (holidaysRes.status === 'rejected') {
    const err = (await holidaysRes.reason) as HttpError
    throw error(err.status, { message: err.body.message })
  }

  if (semesterEntriesRes.status === 'rejected') {
    const err = (await semesterEntriesRes.reason) as HttpError
    throw error(err.status, { message: err.body.message })
  }

  if (semestersRes.status === 'rejected') {
    const err = (await semestersRes.reason) as HttpError
    throw error(err.status, { message: err.body.message })
  }

  const semesters: Semester[] = await semestersRes.value.json()

  const { selectedCalendarView, selectedCalendarDate } = getCalendarCookies(cookies)

  return {
    holidays: holidaysRes.value,
    semesterEntries: semesterEntriesRes.value,
    semesters,
    selectedCalendarView,
    selectedCalendarDate
  }
}
