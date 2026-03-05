import { schedulePlanningFilter } from '$lib/store.svelte'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ data, fetch }) => {
  await schedulePlanningFilter.init(fetch)
  return { ...data }
}
