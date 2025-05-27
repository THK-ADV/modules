import { url } from '$lib/http'
import { getValidAccessToken } from '$lib/server/auth'
import type { ModuleDraft, ModuleDraftState } from '$lib/types/module-draft'
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

function moduleDraftStateOrd(state: ModuleDraftState): number {
	switch (state) {
		case 'waiting_for_changes':
			return 0
		case 'valid_for_publication':
			return 1
		case 'valid_for_review':
			return 2
		case 'waiting_for_publication':
			return 3
		case 'waiting_for_review':
			return 4
		case 'published':
			return 5
		case 'unknown':
			return 6
	}
}

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
	const moduleDrafts: ModuleDraft[] = await res.json()
	moduleDrafts.sort((a, b) => {
		const lhsState = moduleDraftStateOrd(a.moduleDraftState.id)
		const rhsState = moduleDraftStateOrd(b.moduleDraftState.id)
		return lhsState === rhsState
			? a.module.title.localeCompare(b.module.title)
			: lhsState - rhsState
	})
	return { moduleDrafts }
}
