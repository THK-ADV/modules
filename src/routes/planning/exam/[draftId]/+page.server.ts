import { EXAM_PLAN_ROUTE_ID } from '$lib/routes'
import { fmtSemester } from '$lib/formats'
import { fetchHolidays, fetchSemesterEntries } from '$lib/server/backend/calendar'
import { error } from '@sveltejs/kit'
import { z } from 'zod/v4'
import { getExamPlan } from '../exam-planning.remote'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, params, parent }) => {
  const { userInfo } = await parent()
  if (!userInfo?.hasExamPlanningViewPrivileges) {
    error(403, { message: 'Keine Berechtigung für die Prüfungsplanung' })
  }
  if (!z.uuid().safeParse(params.draftId).success) error(404, 'Prüfungsplan nicht gefunden')

  const [plan, holidays, semesterEntries] = await Promise.all([
    getExamPlan(params.draftId),
    fetchHolidays(fetch),
    fetchSemesterEntries(fetch)
  ])

  return {
    draftId: params.draftId,
    holidays,
    semesterEntries,
    breadcrumbLabels: { [EXAM_PLAN_ROUTE_ID]: fmtSemester(plan.semester) }
  }
}
