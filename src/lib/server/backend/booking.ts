import { canSeeFacultyBookings, type User } from '$lib/auth'
import type { BookingEventProps, CalendarEvent } from '$lib/calendar'
import { bookingEventColor } from '$lib/calendar/types'
import {
  bookingListResponseSchema,
  createBookingsInputSchema,
  fetchBookingsInputSchema,
  nonEmptyBookingListResponseSchema,
  updateBookingInputSchema
} from '$lib/schemas/booking'
import { scheduleSeriesOccurrenceListResponseSchema } from '$lib/schemas/schedule'
import {
  isTeachingKind,
  type Booking,
  type BookingCreate,
  type BookingEdit,
  type BookingKind
} from '$lib/types/booking'
import type { SeriesOccurrence } from '$lib/types/schedule'
import { semesterIdOf } from '$lib/types/semester'
import { z } from 'zod/v4'
import { fetchBackend, fetchBackendJson, parseBackendRequestInput } from './http'

// Note(BK9C2F): Event mapping and create/update/series/delete/occurrence helpers
// are a twin of Note(BK9C2F) in schedule-entry.ts (mapping) and calendar.ts
// (schedule-entry CRUD). Keep request parsing, HTTP verbs/paths, and calendar
// event mapping in sync. Fetch-by-semester and faculty kinds are booking-specific.
function toBookingEvent(booking: Booking): CalendarEvent<BookingEventProps> {
  return {
    id: booking.id,
    title: booking.title,
    start: booking.start,
    end: booking.end,
    backgroundColor: bookingEventColor(booking) + 'CC',
    extendedProps: isTeachingKind(booking)
      ? { source: 'booking', kind: 'teaching', raw: booking }
      : { source: 'booking', kind: booking.kind, raw: booking }
  }
}

function toBookingWriteRequest(entry: BookingCreate | BookingEdit) {
  const base = {
    kind: entry.kind,
    seriesId: entry.seriesId,
    title: entry.title,
    note: entry.note,
    rooms: entry.rooms,
    lecturer: entry.lecturer,
    start: entry.start.toISOString(),
    end: entry.end.toISOString()
  }
  return isTeachingKind(entry)
    ? { ...base, module: entry.module, courseType: entry.courseType, po: entry.po }
    : base
}

/** Fetches the bookings of the given kinds for one semester in parallel. */
export async function fetchBookingsForSemester(
  fetch: typeof globalThis.fetch,
  semester: string,
  kinds: BookingKind[],
  bypassCache: boolean
): Promise<CalendarEvent<BookingEventProps>[]> {
  const input = parseBackendRequestInput(
    fetchBookingsInputSchema,
    { semester, kinds, bypassCache },
    'Ungültige Buchungsabfrage'
  )
  const headers: HeadersInit = {}
  if (input.bypassCache) {
    headers['Cache-Control'] = 'no-cache'
  }

  const lists = await Promise.all(
    [...new Set(input.kinds)].map((kind) => {
      const params = new URLSearchParams({ kind, semester: input.semester })
      // Faculty bookings require a bearer token; teaching and campus are public.
      const prefix = kind === 'faculty' ? '/auth-api' : '/api'
      return fetchBackendJson(
        fetch,
        `${prefix}/bookings?${params}`,
        bookingListResponseSchema,
        'Fehler beim Laden der Buchungen',
        { headers }
      )
    })
  )
  return lists.flat().map(toBookingEvent)
}

/** Page-load data for the calendar pages: bookings of the requested semester (current by default), kinds by user role. */
export async function loadCurrentSemesterBookings(
  fetch: typeof globalThis.fetch,
  user: User | undefined,
  bypassCache: boolean,
  bookingSemester = semesterIdOf(new Date())
) {
  const canSeeFaculty = canSeeFacultyBookings(user)
  const bookingKinds: BookingKind[] = canSeeFaculty
    ? ['teaching', 'campus', 'faculty']
    : ['teaching', 'campus']
  const bookings = await fetchBookingsForSemester(fetch, bookingSemester, bookingKinds, bypassCache)
  return { bookings, bookingSemester, bookingKinds, canSeeFaculty }
}

export async function fetchBookingSeriesOccurrences(
  fetch: typeof globalThis.fetch,
  seriesId: string
): Promise<SeriesOccurrence[]> {
  const parsedSeriesId = parseBackendRequestInput(
    z.string().trim().min(1),
    seriesId,
    'Ungültige Terminreihen-ID'
  )
  return fetchBackendJson(
    fetch,
    `/auth-api/bookings/series/${encodeURIComponent(parsedSeriesId)}/occurrences`,
    scheduleSeriesOccurrenceListResponseSchema,
    'Fehler beim Laden der Serientermine'
  )
}

export async function createBookings(
  fetch: typeof globalThis.fetch,
  entries: BookingCreate[]
): Promise<CalendarEvent<BookingEventProps>[]> {
  const parsedEntries = parseBackendRequestInput(
    createBookingsInputSchema,
    entries,
    'Ungültige Buchungen'
  )
  const created = await fetchBackendJson(
    fetch,
    '/auth-api/bookings',
    nonEmptyBookingListResponseSchema,
    'Fehler beim Erstellen der Buchungen',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedEntries.map(toBookingWriteRequest))
    }
  )
  return created.map(toBookingEvent)
}

export async function updateBooking(
  fetch: typeof globalThis.fetch,
  entry: BookingEdit,
  scope: 'single' | 'series'
): Promise<CalendarEvent<BookingEventProps>[]> {
  const parsedEntry = parseBackendRequestInput(updateBookingInputSchema, entry, 'Ungültige Buchung')
  const path = `/auth-api/bookings/${encodeURIComponent(parsedEntry.id)}`
  const updated = await fetchBackendJson(
    fetch,
    scope === 'series' ? `${path}/series` : path,
    nonEmptyBookingListResponseSchema,
    'Fehler beim Aktualisieren der Buchung',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toBookingWriteRequest(parsedEntry))
    }
  )
  return updated.map(toBookingEvent)
}

export async function deleteBooking(fetch: typeof globalThis.fetch, id: string): Promise<void> {
  const bookingId = parseBackendRequestInput(z.string().trim().min(1), id, 'Ungültige Buchungs-ID')
  await fetchBackend(
    fetch,
    `/auth-api/bookings/${encodeURIComponent(bookingId)}`,
    'Fehler beim Löschen der Buchung',
    { method: 'DELETE' }
  )
}
