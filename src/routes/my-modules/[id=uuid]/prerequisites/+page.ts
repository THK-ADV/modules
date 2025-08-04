import { moduleUpdateState } from '$lib/store.svelte'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, data }) => {
  await moduleUpdateState.fetchPrerequisitesInfo(fetch)
  return data
}
