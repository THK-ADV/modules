import {
  createScheduleEntryDrafts,
  deleteScheduleEntryDraft,
  fetchScheduleEntryDraftsByRange,
  fetchScheduleEntryDraftSeriesOccurrences,
  updateScheduleEntryDraft,
  updateScheduleEntryDraftSeries
} from '$lib/server/backend/plan-draft'
import {
  createDraftScheduleEntriesInputSchema,
  deleteDraftScheduleEntryInputSchema,
  fetchDraftScheduleEntrySeriesInputSchema,
  fetchDraftScheduleEntriesInputSchema,
  updateDraftScheduleEntryInputSchema
} from '$lib/schemas/schedule'
import { command, getRequestEvent, query } from '$app/server'

export const fetchDraftScheduleEntries = query(
  fetchDraftScheduleEntriesInputSchema,
  async ({ draftId, range }) => {
    const { fetch } = getRequestEvent()
    return fetchScheduleEntryDraftsByRange(
      fetch,
      draftId,
      range.start,
      range.end,
      range.bypassCache
    )
  }
)

export const createDraftScheduleEntries = command(
  createDraftScheduleEntriesInputSchema,
  async ({ draftId, entries }) => {
    const { fetch } = getRequestEvent()
    return createScheduleEntryDrafts(fetch, draftId, entries)
  }
)

export const updateDraftScheduleEntry = command(
  updateDraftScheduleEntryInputSchema,
  async ({ draftId, entry }) => {
    const { fetch } = getRequestEvent()
    return updateScheduleEntryDraft(fetch, draftId, entry)
  }
)

export const updateDraftScheduleEntrySeries = command(
  updateDraftScheduleEntryInputSchema,
  async ({ draftId, entry }) => {
    const { fetch } = getRequestEvent()
    return updateScheduleEntryDraftSeries(fetch, draftId, entry)
  }
)

export const fetchDraftScheduleEntrySeriesOccurrences = query(
  fetchDraftScheduleEntrySeriesInputSchema,
  async ({ draftId, seriesId }) => {
    const { fetch } = getRequestEvent()
    return fetchScheduleEntryDraftSeriesOccurrences(fetch, draftId, seriesId)
  }
)

export const deleteDraftScheduleEntry = command(
  deleteDraftScheduleEntryInputSchema,
  async ({ draftId, id }) => {
    const { fetch } = getRequestEvent()
    await deleteScheduleEntryDraft(fetch, draftId, id)
  }
)
