import { fetchScheduleEntriesByRange } from '$lib/server/calendar'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch, url }) => {
  const events = await fetchScheduleEntriesByRange(
    fetch,
    url.searchParams.get('start'),
    url.searchParams.get('end')
  )
  return json(events, { status: 200 })
}
