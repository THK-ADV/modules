import { schedulePlanningFilter } from '$lib/stores/schedule-filter.svelte'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ data }) => {
  await schedulePlanningFilter.init()
  return data
}
