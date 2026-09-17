import type { CourseType, ModuleManagement, PO, ScheduleEntry } from './schedule'
import { clonePOs } from './schedule'

export const BOOKING_KINDS = ['teaching', 'campus', 'faculty'] as const

export type BookingKind = (typeof BOOKING_KINDS)[number]

export const BOOKING_KIND_LABELS: Record<BookingKind, string> = {
  teaching: 'Lehre',
  campus: 'Campus-Event',
  faculty: 'Fakultäts-Event'
}

export interface BookingMetadata {
  createdBy: { id: string; label: string }
  updatedAt: Date
}

/** Read model for teaching bookings: a schedule entry plus booking fields. */
export interface TeachingBooking extends ScheduleEntry, BookingMetadata {
  kind: 'teaching'
  title: string
  note: string | null
}

/** Read model for campus and faculty bookings. `lecturer` holds the contact persons. */
export interface CampusBooking extends BookingMetadata {
  id: string
  seriesId: string
  start: Date
  end: Date
  kind: 'campus' | 'faculty'
  title: string
  note: string | null
  rooms: { id: string; abbrev: string }[]
  lecturer: ModuleManagement[]
}

export type Booking = TeachingBooking | CampusBooking

export function isTeachingBooking(
  entry: ScheduleEntry | TeachingBooking
): entry is TeachingBooking {
  return 'kind' in entry && entry.kind === 'teaching'
}

/** Narrows teaching bookings and teaching write-models by `kind`. */
export function isTeachingKind<T extends { kind: string }>(
  value: T
): value is T & { kind: 'teaching' } {
  return value.kind === 'teaching'
}

// Note(BK2F6A): Teaching write models are a twin of Note(BK2F6A) ScheduleEntryCreate/Edit
// in types/schedule.ts. Keep module/courseType/rooms/po/lecturer/series/date
// fields in sync; title, note, and kind are booking-specific.
interface BookingWriteBase {
  title: string
  note: string | null
  start: Date
  end: Date
  rooms: string[]
  lecturer: string[]
  seriesId: string
}

export type BookingCreate =
  | (BookingWriteBase & { kind: 'teaching'; module: string; courseType: CourseType; po: PO[] })
  | (BookingWriteBase & { kind: 'campus' | 'faculty' })

export type BookingEdit = BookingCreate & { id: string }

export function toBookingEdit(
  raw: Booking,
  start: Date = raw.start,
  end: Date = raw.end
): BookingEdit {
  const base = {
    id: raw.id,
    seriesId: raw.seriesId,
    title: raw.title,
    note: raw.note,
    start: new Date(start),
    end: new Date(end),
    rooms: raw.rooms.map(({ id }) => id),
    lecturer: raw.lecturer.map(({ id }) => id)
  }
  if (isTeachingKind(raw)) {
    return {
      ...base,
      kind: 'teaching',
      module: raw.module,
      courseType: raw.courseType,
      po: clonePOs(raw.po)
    }
  }
  return { ...base, kind: raw.kind }
}
