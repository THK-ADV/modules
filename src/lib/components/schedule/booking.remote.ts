import { command, getRequestEvent, query } from '$app/server'
import {
  createBookingsInputSchema,
  fetchBookingsInputSchema,
  updateBookingInputSchema
} from '$lib/schemas/booking'
import {
  createBookings as createBookingsBackend,
  deleteBooking as deleteBookingBackend,
  fetchBookingSeriesOccurrences as fetchBookingSeriesOccurrencesBackend,
  fetchBookingsForSemester,
  updateBooking as updateBookingBackend
} from '$lib/server/backend/booking'
import { z } from 'zod/v4'

/** Fetches the bookings of the given kinds for one semester. */
export const fetchBookings = query(
  fetchBookingsInputSchema,
  async ({ semester, kinds, bypassCache }) => {
    const { fetch } = getRequestEvent()
    return fetchBookingsForSemester(fetch, semester, kinds, bypassCache)
  }
)

// Note(BK3A7B): Create/update/series/occurrences/delete remotes are a twin of
// Note(BK3A7B) in schedule.remote.ts. Keep command/query wrappers in sync.
/** Creates bookings. Returns the created bookings. */
export const createBookings = command(createBookingsInputSchema, async (entries) => {
  const { fetch } = getRequestEvent()
  return createBookingsBackend(fetch, entries)
})

/** Updates a single booking. Returns the updated booking. */
export const updateBooking = command(updateBookingInputSchema, async (entry) => {
  const { fetch } = getRequestEvent()
  return updateBookingBackend(fetch, entry, 'single')
})

/** Updates every booking in the same series. Returns the updated bookings. */
export const updateBookingSeries = command(updateBookingInputSchema, async (entry) => {
  const { fetch } = getRequestEvent()
  return updateBookingBackend(fetch, entry, 'series')
})

/** Fetches the occurrences belonging to a booking series. */
export const fetchBookingSeriesOccurrences = query(z.string().trim().min(1), async (seriesId) => {
  const { fetch } = getRequestEvent()
  return fetchBookingSeriesOccurrencesBackend(fetch, seriesId)
})

export const deleteBooking = command(z.string().trim().min(1), async (id) => {
  const { fetch } = getRequestEvent()
  await deleteBookingBackend(fetch, id)
})
