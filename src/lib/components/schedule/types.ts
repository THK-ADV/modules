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

export interface ScheduleProps {
  initialView: CalendarView
  initialDate: string
  holidays: CalendarEvent<HolidayEventProps>[]
  semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
  scheduleFetcher: (info: DateRangeInfo) => Promise<Response>
  scheduleFilter: ScheduleFilter
  sourceEventCounts: Record<EventSource, number>
  scheduleEntries?: CalendarEvent<ScheduleEventProps>[]
  onEventClick?: (info: EventClickInfo) => void
  onDateSelect?: (info: DateSelectInfo) => void
  onEventDrop?: (info: EventDropInfo) => void
  onEventCopy?: (info: EventCopyInfo) => void
  onEventResize?: (info: EventResizeInfo) => void
}
