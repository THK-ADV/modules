import { z } from 'zod/v4'
import {
  backendDateTimeResponseSchema,
  clonePOs,
  courseTypeSchema,
  isSameScheduleDate,
  scheduleEntryFormFields,
  scheduleEntryResponseSchema,
  scheduleManagementResponseSchema,
  schedulePoSchema,
  scheduleRoomResponseSchema,
  type ScheduleEntry
} from './schedule'

export const bookingKindSchema = z.enum(['teaching', 'campus', 'faculty'])

export type BookingKind = z.infer<typeof bookingKindSchema>

export const BOOKING_KIND_LABELS: Record<BookingKind, string> = {
  teaching: 'Lehre',
  campus: 'Campus-Event',
  faculty: 'Fakultäts-Event'
}
const otherBookingKindSchema = z.enum(['campus', 'faculty'])

function withDateChecks<T extends z.ZodType<{ start: Date; end: Date }>>(schema: T): T {
  return schema
    .refine(({ start, end }) => end > start, {
      message: 'Ende muss nach Beginn liegen',
      path: ['end']
    })
    .refine(({ start, end }) => isSameScheduleDate(start, end), {
      message: 'Beginn und Ende müssen am selben Tag liegen',
      path: ['end']
    })
}

// Remote-function and backend-request inputs
export const fetchBookingsInputSchema = z.object({
  semester: z.string().trim().min(1),
  kinds: z.array(bookingKindSchema).min(1),
  bypassCache: z.boolean()
})

const bookingInputFields = {
  title: z.string().trim().min(1).max(50),
  note: z.string().trim().min(1).nullable(),
  start: z.date(),
  end: z.date(),
  rooms: z.array(z.string().trim().min(1)).min(1),
  lecturer: z.array(z.string().trim().min(1)).min(1),
  seriesId: z.string()
}

// Note(BK5B4D): Teaching write input mirrors Note(BK5B4D) scheduleEntryInputFields
// in schemas/schedule.ts. Keep module/courseType/rooms/po/lecturer/series/date
// constraints in sync; title, note, and kind are booking-specific.
const teachingBookingInputSchema = z.object({
  kind: z.literal('teaching'),
  ...bookingInputFields,
  module: z.string().trim().min(1),
  courseType: courseTypeSchema,
  po: z.array(schedulePoSchema).min(1)
})

const otherBookingInputSchema = z.object({
  kind: otherBookingKindSchema,
  ...bookingInputFields
})

const idField = { id: z.string().trim().min(1) }

export const createBookingsInputSchema = z
  .array(
    withDateChecks(
      z.discriminatedUnion('kind', [teachingBookingInputSchema, otherBookingInputSchema])
    )
  )
  .min(1)

export const updateBookingInputSchema = withDateChecks(
  z.discriminatedUnion('kind', [
    teachingBookingInputSchema.extend(idField),
    otherBookingInputSchema.extend(idField)
  ])
)

export type BookingCreate = z.infer<typeof createBookingsInputSchema>[number]
export type BookingEdit = z.infer<typeof updateBookingInputSchema>

// Backend responses
const teachingBookingResponseSchema = scheduleEntryResponseSchema.safeExtend({
  kind: z.literal('teaching'),
  title: z.string().trim().min(1),
  note: z.string().nullable(),
  createdBy: z.object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1)
  }),
  updatedAt: backendDateTimeResponseSchema
})

const otherBookingResponseSchema = withDateChecks(
  z.object({
    id: z.string().trim().min(1),
    seriesId: z.string(),
    start: backendDateTimeResponseSchema,
    end: backendDateTimeResponseSchema,
    kind: otherBookingKindSchema,
    title: z.string().trim().min(1),
    note: z.string().nullable(),
    rooms: z.array(scheduleRoomResponseSchema).min(1),
    lecturer: z.array(scheduleManagementResponseSchema),
    createdBy: z.object({
      id: z.string().trim().min(1),
      label: z.string().trim().min(1)
    }),
    updatedAt: backendDateTimeResponseSchema
  })
)

const bookingResponseSchema = z.discriminatedUnion('kind', [
  teachingBookingResponseSchema,
  otherBookingResponseSchema
])

/** Read model for teaching bookings: a schedule entry plus booking fields. */
export type TeachingBooking = z.infer<typeof teachingBookingResponseSchema>
/** Read model for campus and faculty bookings. `lecturer` holds the contact persons. */
export type CampusBooking = z.infer<typeof otherBookingResponseSchema>
export type Booking = TeachingBooking | CampusBooking
export type BookingMetadata = Pick<Booking, 'createdBy' | 'updatedAt'>

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

export const bookingListResponseSchema = z.array(bookingResponseSchema)
export const nonEmptyBookingListResponseSchema = z.array(bookingResponseSchema).min(1)

// Client-side forms
const bookingFormFields = {
  title: z
    .string()
    .trim()
    .min(1, 'Titel erforderlich')
    .max(50, 'Titel darf höchstens 50 Zeichen haben'),
  note: z.string(),
  rooms: scheduleEntryFormFields.rooms,
  lecturer: z.array(z.string()).min(1, 'Mindestens eine Ansprechperson erforderlich'),
  date: scheduleEntryFormFields.date
}

export const otherBookingFormSchema = z.object({
  kind: otherBookingKindSchema,
  ...bookingFormFields
})

export const teachingBookingFormSchema = z.object({
  kind: z.literal('teaching'),
  ...bookingFormFields,
  module: scheduleEntryFormFields.module,
  courseType: scheduleEntryFormFields.courseType,
  pos: scheduleEntryFormFields.pos
})

export const bookingFormSchema = z.discriminatedUnion('kind', [
  teachingBookingFormSchema,
  otherBookingFormSchema
])

export type BookingFormData = z.infer<typeof bookingFormSchema>
