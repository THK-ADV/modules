import { buildLoginRedirect } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, cookies }) => {
  // pass through the redirect url
  const rawRedirectTo = url.searchParams.get('redirectTo') || '/'
  const redirectTo = rawRedirectTo.startsWith('/') ? rawRedirectTo : '/'
  const login = await buildLoginRedirect(cookies, url.origin, redirectTo)
  throw redirect(303, login)
}
