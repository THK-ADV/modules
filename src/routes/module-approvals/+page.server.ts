import type { ModuleReviewKey } from '$lib/types/module-review-keys'
import type { ReviewRequest, ReviewRequestJson } from '$lib/types/review-request'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

function groupReviewRequestsByModule(reviewRequests: ReviewRequestJson[]): ReviewRequest[] {
  const grouped = new Map<string, ReviewRequest>()

  for (const request of reviewRequests) {
    if (!grouped.has(request.moduleId)) {
      grouped.set(request.moduleId, {
        moduleId: request.moduleId,
        moduleTitle: request.moduleTitle,
        moduleAbbrev: request.moduleAbbrev,
        author: request.author,
        status: request.status,
        items: []
      })
    }
    const group = grouped.get(request.moduleId)!
    group.items.push({
      reviewId: request.reviewId,
      role: request.role,
      studyProgram: request.studyProgram,
      degree: request.degree,
      canReview: request.canReview
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
    fetch(`/auth-api/moduleApprovals/own`),
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

  const json: ReviewRequestJson[] = await approvalsRes.value.json()
  const reviewRequests = groupReviewRequestsByModule(json)

  return { reviewRequests, moduleReviewKeys }
}
