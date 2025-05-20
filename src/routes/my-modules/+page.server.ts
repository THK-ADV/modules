import { getValidAccessToken } from '$lib/server/auth'
import { url } from '$lib/http'
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const accessToken = await getValidAccessToken(cookies, fetch)

	if (!accessToken) {
		throw redirect(303, 'login')
	}

	const res = await fetch(`${url}/moduleDrafts/own`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	})
	if (!res.ok) {
		const err = await res.json()
		const message = `Module konnten nicht geladen werden: ${err.message}`
		throw error(res.status, { message })
	}
	const modules = await res.json()
	return { modules }
}
