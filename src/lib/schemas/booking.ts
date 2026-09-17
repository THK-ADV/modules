import { BOOKING_KINDS } from '$lib/types/booking'
import { z } from 'zod/v4'
import {
  backendDateTimeResponseSchema,
  courseTypeSchema,
  isSameScheduleDate,
  scheduleEntryFormFields,
  scheduleEntryResponseSchema,
  scheduleManagementResponseSchema,
  schedulePoSchema,
  scheduleRoomResponseSchema
} from './schedule'

export const bookingKindSchema = z.enum(BOOKING_KINDS)
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
