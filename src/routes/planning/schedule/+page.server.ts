import { fetchPlanDrafts, fetchPlanningSemesters } from '$lib/server/backend/plan-draft'
import { createPlanDraftViews } from '$lib/types/plan-draft'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { userInfo } = await parent()

  if (!userInfo?.hasSchedulePlanningPrivileges) {
    throw error(403, { message: 'Keine Berechtigung für die Stundenplanung' })
  }

  const [semesters, allDrafts] = await Promise.all([
    fetchPlanningSemesters(fetch),
    fetchPlanDrafts(fetch, 'schedule')
  ])

  const drafts = createPlanDraftViews(allDrafts, semesters)

  return { semesters, drafts }
}
