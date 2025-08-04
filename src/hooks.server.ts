import { BACKEND_URL_PREFIX } from '$env/static/private'
import { routesMap } from '$lib/routes.svelte'
import { getValidAccessToken } from '$lib/server/auth'
import { redirect, type Handle } from '@sveltejs/kit'

/**
 * API Proxy Configuration
 *
 * These prefixes are used to proxy frontend requests to the backend service.
 * The SvelteKit handle function intercepts requests with these prefixes and
 * forwards them to the backend defined by BACKEND_URL_PREFIX.
 */

/**
 * Prefix for authenticated API requests to the backend.
 * - Requires a valid access token which is automatically added as Authorization header
 * - URL rewriting: /auth-api/some/path -> BACKEND_URL_PREFIX/some/path
 */
const AUTH_API_PREFIX = '/auth-api'

/**
 * Prefix for unauthenticated API requests to the backend.
 * - No authentication required, requests are proxied as-is
 * - URL rewriting: /api/some/path -> BACKEND_URL_PREFIX/some/path
 */
const API_PREFIX = '/api'

export const handle: Handle = async ({ event, resolve }) => {
  const protectedRoutes = routesMap.protectedRoutes

  // check if current route is protected. redirect to login if not authenticated
  if (protectedRoutes.some((route) => event.url.pathname.startsWith(route))) {
    const accessToken = await getValidAccessToken(event.cookies, event.fetch)

    if (!accessToken) {
      console.log('[protected] redirecting to login', event.url.pathname)
      throw redirect(303, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`)
    }

    return await resolve(event)
  }

  // handle authenticated requests by setting the access token in the request headers
  if (event.url.pathname.startsWith(AUTH_API_PREFIX)) {
    const accessToken = await getValidAccessToken(event.cookies, event.fetch)
    console.assert(!!accessToken, 'access token should be defined')

    const requestInit: RequestInit & { duplex?: string } = {
      method: event.request.method,
      headers: {
        ...Object.fromEntries(event.request.headers),
        Authorization: `Bearer ${accessToken}`
      },
      body: event.request.body
    }

    // only add duplex for requests with bodies since it seems to be required
    if (
      event.request.body &&
      (event.request.method === 'POST' ||
        event.request.method === 'PUT' ||
        event.request.method === 'PATCH')
    ) {
      requestInit.duplex = 'half'
    }

    const backendUrl =
      BACKEND_URL_PREFIX + event.url.pathname.slice(AUTH_API_PREFIX.length) + event.url.search

    console.log('[auth-api] rewrite from', event.url.pathname, ' to ', backendUrl)

    const proxyResponse = await fetch(backendUrl, requestInit)

    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: proxyResponse.headers
    })
  }

  // handle API proxy for requests starting with /api
  if (event.url.pathname.startsWith(API_PREFIX)) {
    const backendUrl =
      BACKEND_URL_PREFIX + event.url.pathname.slice(API_PREFIX.length) + event.url.search

    console.log('[api] rewrite from', event.url.pathname, ' to ', backendUrl)

    const proxyResponse = await fetch(backendUrl, event.request)

    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: proxyResponse.headers
    })
  }

  // continue with all other routes
  const response = await resolve(event)
  return response
}
