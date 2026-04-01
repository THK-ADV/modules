import type {
  CalendarEvent,
  DateRangeInfo,
  DateSelectInfo,
  EventClickInfo,
  EventCopyInfo,
  EventDropInfo,
  EventResizeInfo,
  HolidayEventProps,
  ScheduleEventProps,
  SemesterPlanEventProps
} from '$lib/calendar'
import type { ScheduleFilter } from '$lib/stores/schedule-filter.svelte'

export interface ScheduleProps {
  holidays: CalendarEvent<HolidayEventProps>[]
  holidaysMonth: CalendarEvent<HolidayEventProps>[]
  semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
  scheduleFetcher: (info: DateRangeInfo) => Promise<Response>
  scheduleFilter: ScheduleFilter
  scheduleEntries?: CalendarEvent<ScheduleEventProps>[]
  onEventClick?: (info: EventClickInfo) => void
  onDateSelect?: (info: DateSelectInfo) => void
  onEventDrop?: (info: EventDropInfo) => void
  onEventCopy?: (info: EventCopyInfo) => void
  onEventResize?: (info: EventResizeInfo) => void
}
