import { command, form, getRequestEvent } from '$app/server'
import { resolve } from '$app/paths'
import { createPlanDraft, deletePlanDraft } from '$lib/server/backend/plan-draft'
import { redirect } from '@sveltejs/kit'
import * as v from 'valibot'

export const createSchedulePlanDraft = form(
  v.object({ semester: v.string() }),
  async ({ semester }) => {
    const { fetch } = getRequestEvent()
    await createPlanDraft(fetch, { kind: 'schedule', semester })
    throw redirect(303, resolve('/planning/schedule'))
  }
)

export const deleteSchedulePlanDraft = command(v.string(), async (draftId) => {
  const { fetch } = getRequestEvent()
  await deletePlanDraft(fetch, draftId)
})
