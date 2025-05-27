import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  // TODO protect routes here
  /* hooks für auth
  prüfen, ob eine page.server.ts nur 1 mal per browser daten fetcht. wenn ja, kann auf local store und page.ts verzichtet werden. zudem prüfen, ob nach wie vor prefetching stattfindet */
  console.log('hook called with event', event.url.pathname)
  const response = await resolve(event)
  return response
}
