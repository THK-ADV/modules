import { url } from '$lib/http'
import { routesMap } from '$lib/routes.svelte'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import type { ModuleDetail } from '$lib/types/module-details'

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(`${url}/modules/${params.id}?extend=true`)
	if (!res.ok) {
		const errorMsg = await res.text()
		throw error(res.status, { message: `Failed to fetch module. Reason: ${errorMsg}` })
	}
	const module: ModuleDetail = await res.json()
	routesMap.selectedModule = { id: module.id, title: module.title }
	return { module }
}
