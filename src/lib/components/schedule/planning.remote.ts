import {
  createScheduleEntriesFromInput,
  deleteScheduleEntry,
  fetchLecturerOptions,
  fetchScheduleEntriesByRange,
  updateScheduleEntryFromInput
} from '$lib/server/backend/calendar'
import type { ScheduleEntryCreate, ScheduleEntryEdit } from '$lib/types/schedule'
import { command, getRequestEvent } from '$app/server'
import * as v from 'valibot'

const dateRangeSchema = v.object({
  start: v.number(),
  end: v.number()
})

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
  seriesId: v.optional(v.string())
})

const scheduleEntryEditSchema = v.object({
  ...scheduleEntryCreateSchema.entries,
  id: v.string()
})

export const getLecturers = command(v.string(), async (module) => {
  const { fetch } = getRequestEvent()
  return fetchLecturerOptions(fetch, module)
})

export const fetchLiveScheduleEntries = command(dateRangeSchema, async ({ start, end }) => {
  const { fetch } = getRequestEvent()
  return fetchScheduleEntriesByRange(fetch, String(start), String(end), true)
})

export const createLiveScheduleEntries = command(
  v.array(scheduleEntryCreateSchema),
  async (entries) => {
    const { fetch } = getRequestEvent()
    return createScheduleEntriesFromInput(fetch, entries as ScheduleEntryCreate[])
  }
)

export const updateLiveScheduleEntry = command(scheduleEntryEditSchema, async (entry) => {
  const { fetch } = getRequestEvent()
  return updateScheduleEntryFromInput(fetch, entry as ScheduleEntryEdit)
})

export const deleteLiveScheduleEntry = command(v.string(), async (id) => {
  const { fetch } = getRequestEvent()
  await deleteScheduleEntry(fetch, id)
})
