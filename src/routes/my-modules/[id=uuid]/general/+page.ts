import { moduleUpdateState } from '$lib/store.svelte'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, fetch }) => {
	const { accessToken } = await parent()
	await moduleUpdateState.fetchGenerationInformationState(accessToken, fetch)
}
