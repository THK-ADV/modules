import { loginUrl } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
  // pass through the redirect url
  const redirectTo = url.searchParams.get('redirectTo') || '/'
  throw redirect(303, loginUrl(url.origin, redirectTo))
}
