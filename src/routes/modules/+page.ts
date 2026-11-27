import { moduleFilter } from '$lib/stores/module-filter.svelte'
import type { PageLoad } from './$types'

// Not awaited in the page: the filter would mount too late for `afterNavigate` to apply a shared link.
export const load: PageLoad = async ({ data }) => {
  await moduleFilter.init()
  return data
}
