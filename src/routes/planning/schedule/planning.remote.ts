import { command, form, getRequestEvent, query } from '$app/server'
import {
  createPlanDraft,
  deletePlanDraft,
  fetchPlanDrafts,
  fetchPlanningSemesters,
  publishPlanDraft
} from '$lib/server/backend/plan-draft'
import { createPlanDraftViews } from '$lib/schemas/plan-draft'
import { z } from 'zod/v4'

/** The plannable semesters and all schedule plan drafts. */
export const getSchedulePlanDrafts = query(async () => {
  const { fetch } = getRequestEvent()
  const [semesters, drafts] = await Promise.all([
    fetchPlanningSemesters(fetch),
    fetchPlanDrafts(fetch)
  ])
  return { semesters, drafts: createPlanDraftViews(drafts, semesters) }
})

export const createSchedulePlanDraft = form(
  z.object({
    semester: z.string().min(1, 'Semester ist erforderlich')
  }),
  async ({ semester }) => {
    const { fetch } = getRequestEvent()
    await createPlanDraft(fetch, { semester })
    await getSchedulePlanDrafts().refresh()
  }
)

export const deleteSchedulePlanDraft = command(z.string().trim().min(1), async (draftId) => {
  const { fetch } = getRequestEvent()
  await deletePlanDraft(fetch, draftId)
  await getSchedulePlanDrafts().refresh()
})

export const publishSchedulePlanDraft = command(z.string().trim().min(1), async (draftId) => {
  const { fetch } = getRequestEvent()
  await publishPlanDraft(fetch, draftId)
})
