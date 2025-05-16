import { browser } from '$app/environment'
import { url } from '$lib/http'
import { keycloak } from '$lib/keycloak.svelte'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params }) => {
	if (browser) {
		const accessToken = await keycloak.refreshToken(document, fetch)
		if (accessToken) {
			const headers: HeadersInit = new Headers()
			headers.set('Authorization', `Bearer ${accessToken}`)
			const res = await fetch(`${url}/moduleDrafts/own`, { headers })
			if (!res.ok) {
				throw error(res.status, `Failed to load ${params}`)
			}
			const modules = await res.json()
			console.log(modules)
			return { modules }
		} else {
			throw error(401, 'Unauthorized')
		}
	}
}
