import type { CalendarEvent, ScheduleEventProps } from '$lib/calendar'
import type {
  ScheduleEntryCreate,
  ScheduleEntryEdit,
  ScheduleEntryUpdateScope,
  SeriesOccurrence
} from '$lib/types/schedule'
import {
  createDraftScheduleEntries,
  deleteDraftScheduleEntry,
  fetchDraftScheduleEntries,
  fetchDraftScheduleEntrySeriesOccurrences,
  updateDraftScheduleEntry,
  updateDraftScheduleEntrySeries
} from './schedule-draft.remote'
import {
  createLiveScheduleEntries,
  deleteLiveScheduleEntry,
  fetchLiveScheduleEntries,
  fetchLiveScheduleEntrySeriesOccurrences,
  updateLiveScheduleEntry,
  updateLiveScheduleEntrySeries
} from './schedule.remote'

export interface ScheduleEntryLoadOptions {
  start: number
  end: number
  bypassCache: boolean
}

export interface ScheduleEntryEditorApi {
  load: (options: ScheduleEntryLoadOptions) => Promise<CalendarEvent<ScheduleEventProps>[]>
  create: (entries: ScheduleEntryCreate[]) => Promise<CalendarEvent<ScheduleEventProps>[]>
  update: (
    entry: ScheduleEntryEdit,
    scope: ScheduleEntryUpdateScope
  ) => Promise<CalendarEvent<ScheduleEventProps>[]>
  delete: (id: string) => Promise<void>
  getSeries: (seriesId: string) => Promise<SeriesOccurrence[]>
}

export const liveScheduleEntryEditorApi: ScheduleEntryEditorApi = {
  async load(options) {
    return await fetchLiveScheduleEntries(options)
  },
  async create(entries) {
    return await createLiveScheduleEntries(entries)
  },
  async update(entry, scope) {
    if (scope === 'series') {
      return await updateLiveScheduleEntrySeries(entry)
    }
    return [await updateLiveScheduleEntry(entry)]
  },
  async delete(id) {
    await deleteLiveScheduleEntry(id)
  },
  async getSeries(seriesId) {
    return await fetchLiveScheduleEntrySeriesOccurrences(seriesId)
  }
}

export function createDraftScheduleEntryEditorApi(draftId: string): ScheduleEntryEditorApi {
  return {
    async load(options) {
      return await fetchDraftScheduleEntries({ draftId, range: options })
    },
    async create(entries) {
      return await createDraftScheduleEntries({ draftId, entries })
    },
    async update(entry, scope) {
      if (scope === 'series') {
        return await updateDraftScheduleEntrySeries({ draftId, entry })
      }
      return [await updateDraftScheduleEntry({ draftId, entry })]
    },
    async delete(id) {
      await deleteDraftScheduleEntry({ draftId, id })
    },
    async getSeries(seriesId) {
      return await fetchDraftScheduleEntrySeriesOccurrences({ draftId, seriesId })
    }
  }
}
