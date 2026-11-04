import { STUDYPROGRAM_ROUTE_ID } from '$lib/routes'
import { fmtStudyProgram } from '$lib/formats'
import { getExamListOptions } from './exam-list.remote'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const { studyProgram } = await getExamListOptions(params.poId)
  return {
    poId: params.poId,
    breadcrumbLabels: { [STUDYPROGRAM_ROUTE_ID]: fmtStudyProgram(studyProgram) }
  }
}
