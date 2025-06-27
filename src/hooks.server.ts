import { env } from '$env/dynamic/private'
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
    const backendUrl = env.BACKEND_URL_PREFIX + event.url.pathname + event.url.search

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

    const proxyResponse = await fetch(backendUrl, requestInit)

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
