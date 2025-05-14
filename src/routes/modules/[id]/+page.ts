import { url } from '$lib/http'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(`${url}/modules/${params.id}`)
	if (!res.ok) {
		throw error(res.status, `Failed to load ${params}`)
	}
	const module = await res.json()
	return { module }
}
