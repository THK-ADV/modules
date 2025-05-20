import { deleteCoockies } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// This is a poor mans version of a logout, since the redirect to the app does not work properly
export const GET: RequestHandler = async ({ cookies }) => {
	deleteCoockies(cookies)
	throw redirect(303, '/')
}
