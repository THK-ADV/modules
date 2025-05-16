import type { LayoutLoad } from './$types'

import { browser } from '$app/environment'
import { keycloak } from '$lib/keycloak.svelte'

async function initKeycloak() {
	const user = await keycloak.init(window)
	return { user }
}

export const load: LayoutLoad = async () => {
	if (!browser) {
		return { init: undefined }
	}
	const user = keycloak.getUserInfo(document)
	if (!user) {
		return initKeycloak()
	}
	return { user }
}
