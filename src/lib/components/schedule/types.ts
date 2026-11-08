import type {
  CalendarEvent,
  DateSelectInfo,
  EventClickInfo,
  EventCopyInfo,
  EventDropInfo,
  EventResizeInfo,
  EventSource,
  HolidayEventProps,
  SemesterPlanEventProps
} from '$lib/calendar'
import type { ScheduleFilter } from '$lib/stores/schedule-filter.svelte'
import type { ScheduleSources } from './schedule-sources.svelte'

export interface ScheduleProps {
  holidays: CalendarEvent<HolidayEventProps>[]
  holidaysMonth: CalendarEvent<HolidayEventProps>[]
  semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
  /** Range-dependent sources; the calendar reports its visible range to them. */
  sources: ScheduleSources
  scheduleFilter: ScheduleFilter
  editableSource?: EventSource | EventSource[]
  onEventClick?: (info: EventClickInfo) => void
  onDateSelect?: (info: DateSelectInfo) => void
  onEventDrop?: (info: EventDropInfo) => void
  onEventCopy?: (info: EventCopyInfo) => void
  onEventResize?: (info: EventResizeInfo) => void
}
