import type { CalendarEvent, ScheduleEventProps } from '$lib/calendar'
import { COURSE_TYPE_COLORS } from '$lib/calendar/types'
import type { ScheduleEntry, ScheduleEntryCreate, ScheduleEntryEdit } from '$lib/types/schedule'

export type ScheduleEntryWriteRequest = Omit<ScheduleEntryEdit, 'id' | 'start' | 'end'> & {
  start: string
  end: string
}

export function toScheduleEvent(entry: ScheduleEntry): CalendarEvent<ScheduleEventProps> {
  return {
    id: entry.id,
    title: entry.moduleTitle,
    start: entry.start,
    end: entry.end,
    backgroundColor: COURSE_TYPE_COLORS[entry.courseType] + 'CC',
    extendedProps: {
      source: 'schedule',
      raw: entry
    }
  }
}

export function toScheduleEvents(entries: ScheduleEntry[]): CalendarEvent<ScheduleEventProps>[] {
  return entries.map(toScheduleEvent)
}

export function toScheduleEntryWriteRequest(
  entry: ScheduleEntryCreate | ScheduleEntryEdit
): ScheduleEntryWriteRequest {
  return {
    module: entry.module,
    courseType: entry.courseType,
    rooms: entry.rooms,
    po: entry.po,
    lecturer: entry.lecturer,
    seriesId: entry.seriesId,
    start: entry.start.toISOString(),
    end: entry.end.toISOString()
  }
}
