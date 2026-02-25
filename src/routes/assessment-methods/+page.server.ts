import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch }) => {
  const response = await fetch('/api/assessmentMethods/counts')

  let countsByAssessmentMethod: Record<string, number> = {}
  if (response.ok) {
    countsByAssessmentMethod = await response.json()
  }

  return { countsByAssessmentMethod }
}
