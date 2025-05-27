import { getValidAccessToken } from '$lib/server/auth'
import { moduleUpdateState } from '$lib/store.svelte'
import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, fetch, params }) => {
	const accessToken = await getValidAccessToken(cookies, fetch)
	if (!accessToken) {
		throw redirect(303, '/login')
	}
	const module = await moduleUpdateState.fetchModule(params.id, accessToken, fetch)
	return { module, accessToken }
}
