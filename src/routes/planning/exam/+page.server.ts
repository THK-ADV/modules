import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  const { userInfo } = await parent()
  if (!userInfo?.hasExamPlanningViewPrivileges) {
    error(403, { message: 'Keine Berechtigung für die Prüfungsplanung' })
  }
}
