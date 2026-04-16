import { performLogout } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ cookies, fetch, url, request }) => {
  // Lightweight CSRF mitigation (best-effort).
  // Keep GET for convenience; reject obvious cross-site triggers based on fetch metadata headers.
  const secFetchSite = request.headers.get('sec-fetch-site')
  if (secFetchSite === 'cross-site') {
    // Don’t let other sites force a logout via <img> / <a>.
    // (A same-site navigation will typically be "same-origin" or "same-site".)
    return new Response('Bad Request', { status: 400 })
  }

  const baseUrl = `${url.protocol}//${url.host}`
  const rawRedirectTo = url.searchParams.get('redirectTo') || '/'
  const redirectTo = rawRedirectTo.startsWith('/') ? rawRedirectTo : '/'
  const logoutUrl = await performLogout(cookies, fetch, baseUrl, redirectTo)
  throw redirect(303, logoutUrl)
}
