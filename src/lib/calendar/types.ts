import type {
  CourseType,
  ScheduleEntry,
  SemesterPlanEntry,
  SemesterPlanType
} from '$lib/types/schedule'
import type { EventInput } from '@fullcalendar/core'

export const SELECTED_CALENDAR_VIEW_COOKIE_NAME = 'calendar:selected-view'
export const SELECTED_CALENDAR_DATE_COOKIE_NAME = 'calendar:selected-date'

/** Must stay in sync with `slotMinTime` / `slotMaxTime` in `calendar.svelte`. */
export const CALENDAR_VISIBLE_DAY_START = '08:00:00'
export const CALENDAR_VISIBLE_DAY_END = '21:00:00'

/**
 * Calendar view types supported by the calendar component.
 */
export type CalendarView = 'timeGridWeek' | 'dayGridMonth' | 'timeGridDay'

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
  source: 'semesterPlan'
}

/**
 * Extended props for schedule (lecture) events.
 */
export interface ScheduleEventProps {
  source: 'schedule'
  raw: ScheduleEntry
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

export const HOLIDAY_COLOR = '#5C5462'

export const SEMESTER_PLAN_TYPE_COLORS: Record<SemesterPlanType, string> = {
  exam: '#D06B5A',
  lecture: '#000000',
  block: '#4E8E84',
  project: '#4E8E84',
  closed_building: HOLIDAY_COLOR,
  self_study: '#8CB84A',
  semester_break: '#8CB84A'
}

export const COURSE_TYPE_COLORS: Record<CourseType, string> = {
  lecture: '#3A8FBF',
  lab: '#2AA89E',
  seminar: '#F0A870',
  exercise: '#7059AA',
  tutorial: '#B43092'
}

/**
 * Calendar event type - a superset of FullCalendar's EventInput.
 * Uses CalendarEventProps for type-safe extendedProps with discriminated unions.
 */
export interface CalendarEvent<
  T extends CalendarEventProps = CalendarEventProps
> extends EventInput {
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
  extendedProps: T
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
  eventId: string
  extendedProps: CalendarEventProps
  newStart: Date | null
  newEnd: Date | null
  revert: () => void
}

/**
 * Arguments passed to the event copy callback (Option/Alt + drag).
 */
export interface EventCopyInfo {
  eventId: string
  extendedProps: CalendarEventProps
  newStart: Date | null
  newEnd: Date | null
  revert: () => void
}

/**
 * Arguments passed to the event resize callback.
 */
export interface EventResizeInfo {
  eventId: string
  extendedProps: CalendarEventProps
  newStart: Date | null
  newEnd: Date | null
  revert: () => void
}

/**
 * Information about the visible date range, passed to callbacks.
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
  /** Get the current title (e.g., "January 2026") */
  getTitle: () => string
}
