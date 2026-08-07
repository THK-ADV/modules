import { fetchModuleDraftState } from '$lib/server/backend/module-details'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ fetch, params }) => ({
  moduleDraftState: await fetchModuleDraftState(fetch, params.id)
})
