import {
  createScheduleEntriesFromInput,
  deleteScheduleEntry,
  fetchLecturerOptions,
  fetchScheduleEntriesByRange,
  updateScheduleEntryFromInput
} from '$lib/server/backend/calendar'
import type { ScheduleEntryCreate, ScheduleEntryEdit } from '$lib/types/schedule'
import { command, getRequestEvent, query } from '$app/server'
import * as v from 'valibot'

/** Timestamp in milliseconds */
const dateRangeSchema = v.object({
  start: v.number(),
  end: v.number()
})

// ScheduleEntryCreate schema
const scheduleEntryCreateSchema = v.object({
  module: v.string(),
  courseType: v.picklist(['lecture', 'lab', 'exercise', 'seminar', 'tutorial']),
  start: v.date(),
  end: v.date(),
  rooms: v.array(v.string()),
  props: v.object({
    po: v.array(
      v.object({
        po: v.string(),
        specialization: v.nullable(v.string()),
        recommendedSemester: v.array(v.number()),
        mandatory: v.boolean()
      })
    ),
    lecturer: v.array(v.string())
  }),
  seriesId: v.string()
})

// ScheduleEntryEdit schema
const scheduleEntryEditSchema = v.object({
  ...scheduleEntryCreateSchema.entries,
  id: v.string()
})

/** Fetches the lecturers for a given module */
export const getLecturers = command(v.string(), async (module) => {
  const { fetch } = getRequestEvent()
  return fetchLecturerOptions(fetch, module)
})

/** Fetches live schedule entries for a given date range */
export const fetchLiveScheduleEntries = query(dateRangeSchema, async ({ start, end }) => {
  const { fetch } = getRequestEvent()
  return fetchScheduleEntriesByRange(fetch, start, end, true)
})

/** Creates live schedule entries. Returns the created entries. */
export const createLiveScheduleEntries = command(
  v.array(scheduleEntryCreateSchema),
  async (entries: ScheduleEntryCreate[]) => {
    const { fetch } = getRequestEvent()
    return createScheduleEntriesFromInput(fetch, entries)
  }
)

/** Updates a live schedule entry. Returns the updated entry. */
export const updateLiveScheduleEntry = command(
  scheduleEntryEditSchema,
  async (entry: ScheduleEntryEdit) => {
    const { fetch } = getRequestEvent()
    return updateScheduleEntryFromInput(fetch, entry)
  }
)

export const deleteLiveScheduleEntry = command(v.string(), async (id) => {
  const { fetch } = getRequestEvent()
  await deleteScheduleEntry(fetch, id)
})
