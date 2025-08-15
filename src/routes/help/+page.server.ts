import type { ModuleReviewKey } from '$lib/types/module-review-keys'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch }) => {
  const response = await fetch('/api/moduleReviewKeys')
  let moduleReviewKeys: ModuleReviewKey[] = []

  if (response.ok) {
    moduleReviewKeys = await response.json()
  }

  return { moduleReviewKeys }
}
