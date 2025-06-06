import { moduleUpdateState } from '$lib/store.svelte'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch, data }) => {
  const { accessToken } = await parent()
  await moduleUpdateState.fetchPrerequisitesInfo(accessToken, fetch)
  return data
}
