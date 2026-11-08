import { EXAM_PLAN_ROUTE_ID } from '$lib/routes'
import { fmtSemester } from '$lib/formats'
import { error } from '@sveltejs/kit'
import { z } from 'zod/v4'
import { getExamPlan } from '../../exam-planning.remote'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent }) => {
  const { userInfo } = await parent()
  if (!userInfo?.hasExamPlanningViewPrivileges) {
    error(403, { message: 'Keine Berechtigung für die Prüfungsplanung' })
  }
  if (!z.uuid().safeParse(params.draftId).success) error(404, 'Prüfungsplan nicht gefunden')
  const plan = await getExamPlan(params.draftId)
  return {
    draftId: params.draftId,
    breadcrumbLabels: { [EXAM_PLAN_ROUTE_ID]: fmtSemester(plan.semester) }
  }
}
