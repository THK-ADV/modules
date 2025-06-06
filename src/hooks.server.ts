import { BACKEND_URL_PREFIX } from '$env/static/private'
import { routesMap } from '$lib/routes.svelte'
import { getValidAccessToken } from '$lib/server/auth'
import { redirect, type Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  const protectedRoutes = routesMap.protectedRoutes

  // check if current route is protected and handle authentication
  if (protectedRoutes.some((route) => event.url.pathname.startsWith(route))) {
    console.log('protected route', event.url.pathname)

    const accessToken = await getValidAccessToken(event.cookies, event.fetch)

    if (!accessToken) {
      throw redirect(303, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`)
    }

    const response = await resolve(event)
    return response
  }

  // handle API proxy for requests starting with /api
  if (event.url.pathname.startsWith('/api')) {
    const accessToken = await getValidAccessToken(event.cookies, event.fetch)
    console.assert(
      !!accessToken,
      'access token should be defined, since the current route is protected'
    )

    // proxy the request to the backend
    const backendUrl = BACKEND_URL_PREFIX + event.url.pathname + event.url.search

    const proxyResponse = await fetch(backendUrl, {
      method: event.request.method,
      headers: {
        ...Object.fromEntries(event.request.headers),
        Authorization: `Bearer ${accessToken}`
      },
      body: event.request.body
    })

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
