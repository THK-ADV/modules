import { command, form, getRequestEvent } from '$app/server'
import { resolve } from '$app/paths'
import { createPlanDraft, deletePlanDraft, publishPlanDraft } from '$lib/server/backend/plan-draft'
import { redirect } from '@sveltejs/kit'
import { z } from 'zod/v4'

export const createSchedulePlanDraft = form(
  z.object({
    semester: z.string().min(1, 'Semester ist erforderlich')
  }),
  async ({ semester }) => {
    const { fetch } = getRequestEvent()
    await createPlanDraft(fetch, { kind: 'schedule', semester })
    throw redirect(303, resolve('/planning/schedule'))
  }
)

export const deleteSchedulePlanDraft = command(z.string().trim().min(1), async (draftId) => {
  const { fetch } = getRequestEvent()
  await deletePlanDraft(fetch, draftId)
})

export const publishSchedulePlanDraft = command(z.string().trim().min(1), async (draftId) => {
  const { fetch } = getRequestEvent()
  await publishPlanDraft(fetch, draftId)
})
