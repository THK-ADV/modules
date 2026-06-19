import {
  createScheduleEntries,
  deleteScheduleEntry,
  fetchLecturerOptions,
  fetchPOOptions,
  fetchScheduleEntriesByRange,
  fetchScheduleEntrySeriesOccurrences,
  updateScheduleEntry,
  updateScheduleEntrySeries
} from '$lib/server/backend/calendar'
import {
  createScheduleEntriesInputSchema,
  scheduleEntriesRangeInputSchema,
  updateScheduleEntryInputSchema
} from '$lib/schemas/schedule'
import { command, getRequestEvent, query } from '$app/server'
import { z } from 'zod/v4'

/** Fetches the lecturers for a given module */
export const getLecturers = query(z.string().trim().min(1), async (module) => {
  const { fetch } = getRequestEvent()
  return fetchLecturerOptions(fetch, module)
})

/** Fetches the POs for a given module */
export const getPOs = query(z.string().trim().min(1), async (module) => {
  const { fetch } = getRequestEvent()
  return fetchPOOptions(fetch, module)
})

/** Fetches live schedule entries for a given date range */
export const fetchLiveScheduleEntries = query(
  scheduleEntriesRangeInputSchema,
  async ({ start, end, bypassCache }) => {
    const { fetch } = getRequestEvent()
    return fetchScheduleEntriesByRange(fetch, start, end, bypassCache)
  }
)

/** Creates live schedule entries. Returns the created entries. */
export const createLiveScheduleEntries = command(
  createScheduleEntriesInputSchema,
  async (entries) => {
    const { fetch } = getRequestEvent()
    return createScheduleEntries(fetch, entries)
  }
)

/** Updates a live schedule entry. Returns the updated entry. */
export const updateLiveScheduleEntry = command(updateScheduleEntryInputSchema, async (entry) => {
  const { fetch } = getRequestEvent()
  return updateScheduleEntry(fetch, entry)
})

/** Updates every live schedule entry in the same series. Returns the updated entries. */
export const updateLiveScheduleEntrySeries = command(
  updateScheduleEntryInputSchema,
  async (entry) => {
    const { fetch } = getRequestEvent()
    return updateScheduleEntrySeries(fetch, entry)
  }
)

/** Fetches the occurrences belonging to a live schedule entry series. */
export const fetchLiveScheduleEntrySeriesOccurrences = query(
  z.string().trim().min(1),
  async (seriesId) => {
    const { fetch } = getRequestEvent()
    return fetchScheduleEntrySeriesOccurrences(fetch, seriesId)
  }
)

export const deleteLiveScheduleEntry = command(z.string().trim().min(1), async (id) => {
  const { fetch } = getRequestEvent()
  await deleteScheduleEntry(fetch, id)
})
