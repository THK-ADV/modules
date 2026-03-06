import type {
  CalendarEvent,
  CalendarView,
  DateRangeInfo,
  DateSelectInfo,
  EventClickInfo,
  EventCopyInfo,
  EventDropInfo,
  EventResizeInfo,
  EventSource,
  HolidayEventProps,
  ScheduleEventProps,
  SemesterPlanEventProps
} from '$lib/calendar'
import type { ScheduleFilter } from '$lib/store.svelte'

export interface ScheduleEntryFetcher {
  id: 'fetch'
  fetch: (info: DateRangeInfo) => Promise<Response>
}

export interface ScheduleEntryData {
  id: 'data'
  entries: CalendarEvent<ScheduleEventProps>[]
}

/**
 * How schedule entries are supplied to the calendar.
 * - `'fetch'`: entries are loaded lazily by calling `fetch` whenever the visible date range changes.
 * - `'data'`:  entries are provided up-front and available immediately (e.g. from a server load).
 */
export type ScheduleEntrySource = ScheduleEntryFetcher | ScheduleEntryData

export interface ScheduleProps {
  initialView: CalendarView
  initialDate: string
  holidays: CalendarEvent<HolidayEventProps>[]
  semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
  scheduleSource: ScheduleEntrySource
  scheduleFilter: ScheduleFilter
  sourceEventCounts: Record<EventSource, number>
  onEventClick?: (info: EventClickInfo) => void
  onDateSelect?: (info: DateSelectInfo) => void
  onEventDrop?: (info: EventDropInfo) => void
  onEventCopy?: (info: EventCopyInfo) => void
  onEventResize?: (info: EventResizeInfo) => void
}
