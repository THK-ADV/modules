import { STUDYPROGRAM_ROUTE_ID } from '$lib/routes'
import { fmtStudyProgram } from '$lib/formats'
import { getStudyProgram } from '../studyprogram.remote'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  const { studyProgram } = await getStudyProgram(params.poId)
  return {
    poId: params.poId,
    breadcrumbLabels: { [STUDYPROGRAM_ROUTE_ID]: fmtStudyProgram(studyProgram) }
  }
}
