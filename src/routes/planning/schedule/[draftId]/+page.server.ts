import { PLAN_ROUTE_ID } from '$lib/routes'
import {
  fetchHolidays,
  fetchSemesterEntries,
  getCalendarCookies
} from '$lib/server/backend/calendar'
import { fetchPlanDraft } from '$lib/server/backend/plan-draft'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, cookies, params, parent }) => {
  const { userInfo } = await parent()

  if (!userInfo?.hasSchedulePlanningPrivileges) {
    throw error(403, { message: 'Keine Berechtigung für die Stundenplanung' })
  }

  const [holidays, semesterEntries, draft] = await Promise.all([
    fetchHolidays(fetch),
    fetchSemesterEntries(fetch),
    fetchPlanDraft(fetch, params.draftId, 'schedule')
  ])

  if (draft.planDraft.publishedAt !== null) {
    throw error(409, { message: 'Veröffentlichte Planungen können nicht bearbeitet werden' })
  }

  const { timeGrid, monthBg } = holidays
  const { selectedCalendarView, selectedCalendarDate } = getCalendarCookies(cookies)

  return {
    holidays: timeGrid,
    holidaysMonth: monthBg,
    semesterEntries,
    selectedCalendarView,
    selectedCalendarDate,
    planDraft: draft.planDraft,
    semester: draft.semester,
    breadcrumbLabels: { [PLAN_ROUTE_ID]: `${draft.semester.deLabel} ${draft.semester.year}` }
  }
}
