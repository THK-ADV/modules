import { fetchActivePlanDrafts, fetchPlanningSemesters } from '$lib/server/backend/plan-draft'
import { createPlanDraftViews } from '$lib/types/plan-draft'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { userInfo } = await parent()

  if (!userInfo?.hasSchedulePlanningPrivileges) {
    throw error(403, { message: 'Keine Berechtigung für die Stundenplanung' })
  }

  const [semesters, activeDrafts] = await Promise.all([
    fetchPlanningSemesters(fetch),
    fetchActivePlanDrafts(fetch, 'schedule')
  ])

  const drafts = createPlanDraftViews(activeDrafts, semesters)

  return { semesters, drafts }
}
