import { scheduleFilter } from '$lib/store.svelte'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ data, fetch }) => {
  await scheduleFilter.init(fetch)
  return { ...data }
}
