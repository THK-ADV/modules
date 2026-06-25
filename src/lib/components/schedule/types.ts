import type {
  CalendarEvent,
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
import type { ScheduleEntryEditorApi } from './schedule-entry-editor-api'

export interface ScheduleProps {
  holidays: CalendarEvent<HolidayEventProps>[]
  holidaysMonth: CalendarEvent<HolidayEventProps>[]
  semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
  bypassCache: boolean
  loadScheduleEntries: ScheduleEntryEditorApi['load']
  scheduleFilter: ScheduleFilter
  scheduleEntries?: CalendarEvent<ScheduleEventProps>[]
  onEventClick?: (info: EventClickInfo) => void
  onDateSelect?: (info: DateSelectInfo) => void
  onEventDrop?: (info: EventDropInfo) => void
  onEventCopy?: (info: EventCopyInfo) => void
  onEventResize?: (info: EventResizeInfo) => void
}
