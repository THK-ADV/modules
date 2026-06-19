import { COURSE_TYPES, SEMESTER_PLAN_TYPES } from '$lib/types/schedule'
import { z } from 'zod/v4'

export const SCHEDULE_TIME_ZONE = 'Europe/Berlin'

const scheduleDateFormatter = new Intl.DateTimeFormat('de-DE', {
  timeZone: SCHEDULE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

export function isSameScheduleDate(lhs: Date, rhs: Date): boolean {
  return scheduleDateFormatter.format(lhs) === scheduleDateFormatter.format(rhs)
}

export const courseTypeSchema = z.enum(COURSE_TYPES, {
  error: 'Ungültige oder fehlende Kursart'
})

export const schedulePoSchema = z.object({
  po: z.string().trim().min(1),
  specialization: z.string().trim().min(1).nullable(),
  recommendedSemester: z.array(z.number()),
  mandatory: z.boolean()
})

// Remote-function and backend-request inputs
const scheduleEntryTimeFields = {
  start: z.date(),
  end: z.date()
}

const scheduleEntryInputFields = {
  module: z.string().trim().min(1),
  courseType: courseTypeSchema,
  ...scheduleEntryTimeFields,
  rooms: z.array(z.string().trim().min(1)).min(1),
  po: z.array(schedulePoSchema).min(1),
  lecturer: z.array(z.string().trim().min(1)),
  seriesId: z.string()
}

const scheduleEntryInputSchema = z
  .object(scheduleEntryInputFields)
  .refine(({ start, end }) => end > start, {
    message: 'Ende muss nach Beginn liegen',
    path: ['end']
  })
  .refine(({ start, end }) => isSameScheduleDate(start, end), {
    message: 'Beginn und Ende müssen am selben Tag liegen',
    path: ['end']
  })

export const createScheduleEntriesInputSchema = z.array(scheduleEntryInputSchema).min(1)

export const updateScheduleEntryInputSchema = scheduleEntryInputSchema.safeExtend({
  id: z.string().trim().min(1)
})

export const scheduleEntriesRangeInputSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    bypassCache: z.boolean()
  })
  .refine(({ start, end }) => end > start, {
    message: 'Ende muss nach Beginn liegen',
    path: ['end']
  })

export const fetchDraftScheduleEntriesInputSchema = z.object({
  draftId: z.string().trim().min(1),
  range: scheduleEntriesRangeInputSchema
})

export const createDraftScheduleEntriesInputSchema = z.object({
  draftId: z.string().trim().min(1),
  entries: createScheduleEntriesInputSchema
})

export const updateDraftScheduleEntryInputSchema = z.object({
  draftId: z.string().trim().min(1),
  entry: updateScheduleEntryInputSchema
})

export const fetchDraftScheduleEntrySeriesInputSchema = z.object({
  draftId: z.string().trim().min(1),
  seriesId: z.string().trim().min(1)
})

export const deleteDraftScheduleEntryInputSchema = z.object({
  draftId: z.string().trim().min(1),
  id: z.string().trim().min(1)
})

// Backend responses
const backendDateTimeResponseSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))

const scheduleManagementResponseSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.enum(['person', 'group', 'unknown']),
  label: z.string().trim().min(1),
  abbreviation: z.string().trim().min(1)
})

const scheduleRoomResponseSchema = z.object({
  id: z.string().trim().min(1),
  abbrev: z.string().trim().min(1)
})

export const scheduleEntryResponseSchema = z
  .object({
    id: z.string().trim().min(1),
    start: backendDateTimeResponseSchema,
    end: backendDateTimeResponseSchema,
    courseType: courseTypeSchema,
    rooms: z.array(scheduleRoomResponseSchema).min(1),
    module: z.string().trim().min(1),
    moduleTitle: z.string().trim().min(1),
    moduleAbbrev: z.string().trim().min(1),
    moduleManagement: z.array(scheduleManagementResponseSchema),
    lecturer: z.array(scheduleManagementResponseSchema),
    teachingUnits: z.array(z.string().trim().min(1)),
    po: z.array(schedulePoSchema).min(1),
    seriesId: z.string()
  })
  .refine(({ start, end }) => end > start, {
    message: 'Ende muss nach Beginn liegen',
    path: ['end']
  })
  .refine(({ start, end }) => isSameScheduleDate(start, end), {
    message: 'Beginn und Ende müssen am selben Tag liegen',
    path: ['end']
  })

export const scheduleEntryListResponseSchema = z.array(scheduleEntryResponseSchema)
export const nonEmptyScheduleEntryListResponseSchema = z.array(scheduleEntryResponseSchema).min(1)

export const scheduleSeriesOccurrenceResponseSchema = z
  .object({
    id: z.string().trim().min(1),
    start: backendDateTimeResponseSchema,
    end: backendDateTimeResponseSchema
  })
  .refine(({ start, end }) => end > start, {
    message: 'Ende muss nach Beginn liegen',
    path: ['end']
  })

export const scheduleSeriesOccurrenceListResponseSchema = z.array(
  scheduleSeriesOccurrenceResponseSchema
)

export const scheduleLecturerOptionListResponseSchema = z.array(z.string().trim().min(1))
export const schedulePoOptionListResponseSchema = z.array(schedulePoSchema)

export const calendarHolidayListResponseSchema = z.array(
  z.object({
    date: z.iso.date(),
    label: z.string().trim().min(1)
  })
)

export const semesterPlanEntryListResponseSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    start: z.iso.date(),
    end: z.iso.date(),
    type: z.enum(SEMESTER_PLAN_TYPES),
    teachingUnit: z.string().trim().min(1).nullable(),
    teachingUnitLabel: z.string().trim().min(1).nullable(),
    semesterIndex: z.array(z.number().int()).nullable(),
    phase: z.string().nullable()
  })
)

// Client-side forms
export const scheduleEntryFormSchema = z.object({
  module: z.string().min(1, 'Modulbezeichnung erforderlich'),
  rooms: z.array(z.string()).min(1, 'Mindestens ein Raum erforderlich'),
  courseType: courseTypeSchema,
  pos: z
    .array(
      z.object({
        po: z.string().min(1, 'Studiengang erforderlich'),
        specialization: z.string().nullable(),
        recommendedSemester: z.array(z.number()),
        mandatory: z.boolean()
      })
    )
    .min(1, 'Mindestens eine PO Beziehung erforderlich'),
  date: z
    .object({
      start: z.date({ error: 'Beginn der Veranstaltung erforderlich' }),
      end: z.date({ error: 'Ende der Veranstaltung erforderlich' })
    })
    .refine(({ start, end }) => end > start, {
      error: 'Ende der Veranstaltung muss nach dem Beginn liegen',
      path: ['end']
    })
    .refine(({ start, end }) => isSameScheduleDate(start, end), {
      error: 'Beginn und Ende müssen am selben Tag liegen',
      path: ['end']
    }),
  lecturer: z.array(z.string())
})

export type ScheduleEntryFormData = z.infer<typeof scheduleEntryFormSchema>

export const scheduleEntryPoFormSchema = z.object({
  fullPOId: z.string().min(1, 'Studiengang erforderlich'),
  recommendedSemester: z.array(z.number()),
  mandatory: z.boolean()
})
