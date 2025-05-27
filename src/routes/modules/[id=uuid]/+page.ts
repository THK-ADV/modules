import { url } from '$lib/http'
import { routesMap } from '$lib/routes.svelte'
import type { ModuleDetail } from '$lib/types/module-details'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch, params, url: pageUrl }) => {
	const source = pageUrl.searchParams.get('source')

	let apiUrl = `${url}/modules/${params.id}?extend=true`
	if (source === 'latest') {
		// TODO: fetch the latest representation of the module
		apiUrl += '&source=latest'
	}

	const res = await fetch(apiUrl)
	if (!res.ok) {
		const errorMsg = await res.text()
		throw error(res.status, { message: `Failed to fetch module. Reason: ${errorMsg}` })
	}
	const module: ModuleDetail = await res.json()
	routesMap.selectedModule = { id: module.id, title: module.title }
	return { module, source }
}
