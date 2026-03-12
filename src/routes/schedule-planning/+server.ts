import {
  createScheduleEntries,
  fetchScheduleEntriesByRange,
  updateScheduleEntry
} from '$lib/server/calendar'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Converts a date string to an ISO 8601 string with the local timezone offset.
 * Unlike `Date.toISOString()`, which always returns UTC, this preserves
 * the local wall-clock time (e.g. "2026-04-22T09:00:00+02:00").
 */
function toLocalISOString(date: Date): string {
  const off = -date.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  const offsetStr = `${sign}${pad(Math.floor(off / 60))}:${pad(off % 60)}`

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':00' +
    offsetStr
  )
}

// Fetches schedule entries for the given date range
export const GET: RequestHandler = async ({ fetch, url }) => {
  const events = await fetchScheduleEntriesByRange(
    fetch,
    url.searchParams.get('start'),
    url.searchParams.get('end'),
    true
  )
  return json(events, { status: 200 })
}

// Creates new schedule entries
export const POST: RequestHandler = async ({ fetch, request }) => {
  const body = await request.json()

  if (!Array.isArray(body)) {
    return json({ message: 'Body muss ein Array sein' }, { status: 400 })
  }

  for (const entry of body) {
    entry.start = toLocalISOString(new Date(entry.start))
    entry.end = toLocalISOString(new Date(entry.end))
  }

  const createdEntries = await createScheduleEntries(fetch, JSON.stringify(body))
  return json(createdEntries, { status: 201 })
}

// Updates an existing schedule entry
export const PUT: RequestHandler = async ({ fetch, request }) => {
  const { id, ...entry } = await request.json()

  if (!id || typeof id !== 'string') {
    return json({ message: 'ID fehlt' }, { status: 400 })
  }

  entry.start = toLocalISOString(new Date(entry.start))
  entry.end = toLocalISOString(new Date(entry.end))

  const updatedEntry = await updateScheduleEntry(fetch, id, entry)
  return json(updatedEntry, { status: 200 })
}

// Deletes a schedule entry
export const DELETE: RequestHandler = async ({ fetch, url }) => {
  const id = url.searchParams.get('id')
  if (!id || typeof id !== 'string') {
    return json({ message: 'ID fehlt' }, { status: 400 })
  }

  const resp = await fetch(`/auth-api/scheduleEntries/${id}`, {
    method: 'DELETE'
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ message: resp.statusText }))
    return json(
      { message: err.message || 'Fehler beim Löschen des Eintrags' },
      { status: resp.status }
    )
  }

  return json({ success: true }, { status: 200 })
}
