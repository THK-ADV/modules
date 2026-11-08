import type {
  BookingEventProps,
  CalendarEvent,
  DateSelectInfo,
  EventClickInfo,
  EventCopyInfo,
  EventDropInfo,
  EventResizeInfo,
  EventSource,
  ExamEventProps,
  HolidayEventProps,
  ScheduleEventProps,
  SemesterPlanEventProps
} from '$lib/calendar'
import type { PublishedExamEntry } from '$lib/schemas/exam-planning'
import type { ScheduleFilter } from '$lib/stores/schedule-filter.svelte'
import type { RemoteQuery } from '@sveltejs/kit'
import type { ScheduleEntryEditorApi } from './schedule-entry-editor-api'

export interface ScheduleProps {
  holidays: CalendarEvent<HolidayEventProps>[]
  holidaysMonth: CalendarEvent<HolidayEventProps>[]
  semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
  bypassCache: boolean
  loadScheduleEntries: ScheduleEntryEditorApi['load']
  scheduleFilter: ScheduleFilter
  scheduleEntries?: CalendarEvent<ScheduleEventProps>[]
  /** Bookings of the current semester; extended lazily when the view leaves it. */
  bookings?: CalendarEvent<BookingEventProps>[]
  /** Semester ID whose bookings are contained in `bookings` on mount. */
  bookingSemester?: string
  loadBookings?: (semester: string) => Promise<CalendarEvent<BookingEventProps>[]>
  /** Loads published exam appointments by range; without it, exams are never shown. */
  loadExamEntries?: (range: {
    start: number
    end: number
  }) => RemoteQuery<CalendarEvent<ExamEventProps<PublishedExamEntry>>[]>
  editableSource?: EventSource | EventSource[]
  onEventClick?: (info: EventClickInfo) => void
  onDateSelect?: (info: DateSelectInfo) => void
  onEventDrop?: (info: EventDropInfo) => void
  onEventCopy?: (info: EventCopyInfo) => void
  onEventResize?: (info: EventResizeInfo) => void
}
