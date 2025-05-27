import { loginUrl } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  throw redirect(303, loginUrl(url.origin))
}
