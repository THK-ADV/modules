import type { ScheduleEventProps } from '$lib/calendar'
import type { ScheduleEntry } from '$lib/types/schedule'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ fetch, url }) => {
  const startStr = url.searchParams.get('start')
  const endStr = url.searchParams.get('end')

  let uri = '/api/scheduleEntries'
  if (startStr && endStr) {
    uri += `?from=${startStr}&to=${endStr}`
  }
  const resp = await fetch(uri)

  if (!resp.ok) {
    const err = await resp.json()
    return json(
      { message: `Fehler beim Laden des Stundenplans: ${err.message}` },
      { status: resp.status }
    )
  }

  const entries: ScheduleEntry[] = await resp.json()
  const events = entries.map((entry) => {
    const extendedProps: ScheduleEventProps = {
      source: 'schedule',
      courseType: entry.courseType,
      room: entry.room,
      roomAbbrev: entry.roomAbbrev,
      module: entry.module,
      moduleManagement: entry.moduleManagement,
      teachingUnits: entry.teachingUnits
    }
    return {
      id: entry.id,
      title: entry.moduleTitle,
      start: entry.start,
      end: entry.end,
      backgroundColor: '#5f7c8a',
      extendedProps
    }
  })

  return json(events, { status: 200 })
}
