import type { ScheduleEntry, SemesterPlanEntry } from '$lib/types/schedule'
import type { EventInput } from '@fullcalendar/core'

export const SELECTED_CALENDAR_VIEW_COOKIE_NAME = 'calendar:selected-view'
export const SELECTED_CALENDAR_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

/**
 * Calendar view types supported by the calendar component.
 */
export type CalendarView = 'timeGridWeek' | 'dayGridMonth'

/**
 * Extended props for holiday events.
 */
export interface HolidayEventProps {
  source: 'holiday'
}

/**
 * Extended props for semester plan events.
 */
export interface SemesterPlanEventProps extends Pick<
  SemesterPlanEntry,
  'type' | 'teachingUnit' | 'semesterIndex'
> {
  source: 'semester-plan'
}

/**
 * Extended props for schedule (lecture) events.
 */
export interface ScheduleEventProps extends Pick<
  ScheduleEntry,
  'courseType' | 'room' | 'roomAbbrev' | 'module' | 'moduleManagement' | 'teachingUnits' | 'props'
> {
  source: 'schedule'
}

/**
 * Extended props for exam events.
 */
export interface ExamEventProps {
  source: 'exam'
}

/**
 * Discriminated union of all event extended props.
 * Use `props.source` to narrow the type.
 */
export type CalendarEventProps =
  | HolidayEventProps
  | SemesterPlanEventProps
  | ScheduleEventProps
  | ExamEventProps

/**
 * Known event source types for the schedule calendar.
 */
export type EventSource = CalendarEventProps['source']

/**
 * Calendar event type - a superset of FullCalendar's EventInput.
 * Uses CalendarEventProps for type-safe extendedProps with discriminated unions.
 */
export interface CalendarEvent extends EventInput {
  /** Unique identifier for the event */
  id: string
  /** Display title of the event */
  title: string
  /** Event start date/time (ISO string or Date) */
  start: string | Date
  /** Event end date/time (ISO string or Date) */
  end?: string | Date
  /** Whether this is an all-day event */
  allDay?: boolean
  /** Background color for the event (CSS color value) */
  backgroundColor?: string
  /** Border color for the event (CSS color value) */
  borderColor?: string
  /** Text color for the event (CSS color value) */
  textColor?: string
  /** CSS class name(s) to apply to the event element */
  classNames?: string[]
  /** Whether the event can be edited (dragged/resized) */
  editable?: boolean
  /** URL to navigate to when the event is clicked */
  url?: string
  /** Custom data associated with the event */
  extendedProps?: CalendarEventProps
}

/**
 * Arguments passed to the date select callback.
 */
export interface DateSelectInfo {
  start: Date
  end: Date
  startStr: string
  endStr: string
  allDay: boolean
}

/**
 * Arguments passed to the event click callback.
 */
export interface EventClickInfo {
  event: {
    id: string
    extendedProps: CalendarEventProps
  }
  jsEvent: MouseEvent
}

/**
 * Arguments passed to the event drop callback.
 */
export interface EventDropInfo {
  event: {
    id: string
    extendedProps: CalendarEventProps
  }
  oldEvent: {
    id: string
    extendedProps: CalendarEventProps
  }
  revert: () => void
}

/**
 * Information about the visible date range, passed to the event fetcher.
 */
export interface DateRangeInfo {
  /** Start of the visible date range */
  start: Date
  /** End of the visible date range */
  end: Date
  /** ISO string of the start date */
  startStr: string
  /** ISO string of the end date */
  endStr: string
}

/**
 * Function type for lazy-loading events based on the visible date range.
 * Called whenever the user navigates to a different date range.
 *
 * @example
 * ```ts
 * const fetcher: EventFetcher = async ({ startStr, endStr }) => {
 *   const response = await fetch(`/api/events?start=${startStr}&end=${endStr}`)
 *   return response.json()
 * }
 * ```
 */
export type EventFetcher = (info: DateRangeInfo) => Promise<CalendarEvent[]>

/**
 * Base configuration shared by all event source types.
 */
interface EventSourceBase {
  /** Unique identifier for this source */
  id: EventSource
  /** Human-readable name for the source (for UI display) */
  name?: string
  /** Color for events from this source */
  color?: string
  /** Display mode: 'auto' (normal), 'background' (subtle background), 'inverse-background' */
  display?: 'auto' | 'background' | 'inverse-background'
}

/**
 * Event source with static events (loaded upfront, e.g., from SSR).
 */
export interface StaticEventSource extends EventSourceBase {
  /** Static array of events */
  events: CalendarEvent[]
  fetcher?: never
}

/**
 * Event source with a fetcher function (lazy-loaded based on visible date range).
 */
export interface FetcherEventSource extends EventSourceBase {
  /** Function to fetch events for the visible date range */
  fetcher: EventFetcher
  events?: never
}

/**
 * Configuration for an event source - either static events or a fetcher function.
 */
export type EventSourceConfig = StaticEventSource | FetcherEventSource

/**
 * API exposed by the Calendar component for external control.
 * Provides methods for navigation and view changes.
 */
export interface CalendarApi {
  /** Navigate to the previous period (week/month depending on view) */
  prev: () => void
  /** Navigate to the next period */
  next: () => void
  /** Navigate to today */
  today: () => void
  /** Change the current view */
  changeView: (view: CalendarView) => void
  /** Get the current title (e.g., "January 2026") */
  getTitle: () => string
  /** Refetch all events from fetcher-based sources */
  refetchEvents: () => void
}
