import type { ModuleReviewKey } from '$lib/types/module-review-keys'
import type { ModuleReview, ModuleReviewJson } from '$lib/types/review-request'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

function groupModuleReviewsByModule(moduleReviews: ModuleReviewJson[]): ModuleReview[] {
  const grouped = new Map<string, ModuleReview>()

  for (const review of moduleReviews) {
    if (!grouped.has(review.moduleId)) {
      grouped.set(review.moduleId, {
        moduleId: review.moduleId,
        moduleTitle: review.moduleTitle,
        moduleAbbrev: review.moduleAbbrev,
        author: review.author,
        status: review.status,
        items: []
      })
    }
    const group = grouped.get(review.moduleId)!
    group.items.push({
      reviewId: review.reviewId,
      role: review.role,
      studyProgram: review.studyProgram,
      degree: review.degree,
      canReview: review.canReview
    })
  }

  const statusOrder = { waiting_for_review: 0, waiting_for_changes: 1 } as const

  return Array.from(grouped.values()).sort((a, b) => {
    const byStatus = statusOrder[a.status.id] - statusOrder[b.status.id]
    if (byStatus !== 0) return byStatus
    return a.moduleTitle.localeCompare(b.moduleTitle)
  })
}

export const load: PageServerLoad = async ({ fetch }) => {
  const [approvalsRes, reviewKeysRes] = await Promise.allSettled([
    fetch(`/auth-api/moduleReviews`),
    fetch('/api/moduleReviewKeys')
  ])

  if (approvalsRes.status === 'rejected') {
    const err = await approvalsRes.reason.json()
    const message = `Änderungsfreigaben konnten nicht geladen werden: ${err.message}`
    throw error(500, { message })
  }

  let moduleReviewKeys: ModuleReviewKey[] = []
  if (reviewKeysRes.status === 'fulfilled') {
    moduleReviewKeys = await reviewKeysRes.value.json()
  }

  const json: ModuleReviewJson[] = await approvalsRes.value.json()
  const moduleReviews = groupModuleReviewsByModule(json)

  return { moduleReviews, moduleReviewKeys }
}
