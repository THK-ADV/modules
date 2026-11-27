import { getRequestEvent, query } from '$app/server'
import { moduleReviewEntrySchema, type ModuleReview } from '$lib/schemas/module-review'
import { fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'

const statusOrder = { waiting_for_review: 0, waiting_for_changes: 1 } as const

/** Reviews still open, one per module, waiting for review first and then by title. */
export const getModuleReviews = query(async () => {
  const { fetch } = getRequestEvent()
  const entries = await fetchBackendJson(
    fetch,
    '/auth-api/moduleReviews',
    z.array(moduleReviewEntrySchema),
    'Änderungsfreigaben konnten nicht geladen werden'
  )

  const grouped = new Map<string, ModuleReview>()
  for (const { reviewId, studyProgram, canReview, ...module } of entries) {
    let group = grouped.get(module.moduleId)
    if (!group) {
      group = { ...module, items: [] }
      grouped.set(module.moduleId, group)
    }
    group.items.push({ reviewId, studyProgram, canReview })
  }

  return Array.from(grouped.values()).sort(
    (a, b) =>
      statusOrder[a.status.id] - statusOrder[b.status.id] ||
      a.moduleTitle.localeCompare(b.moduleTitle)
  )
})
