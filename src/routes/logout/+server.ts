import { performLogout } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
  const baseUrl = `${url.protocol}//${url.host}`
  const redirectTo = url.searchParams.get('redirectTo') || '/'
  const logoutUrl = await performLogout(cookies, fetch, baseUrl, redirectTo)
  throw redirect(303, logoutUrl)
}
