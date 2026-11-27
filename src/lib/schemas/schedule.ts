import { TIME_ZONE } from '$lib/formats'
import { z } from 'zod/v4'

const scheduleDateFormatter = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

export function isSameScheduleDate(lhs: Date, rhs: Date): boolean {
  return scheduleDateFormatter.format(lhs) === scheduleDateFormatter.format(rhs)
}

export const courseTypeSchema = z.enum(['lecture', 'lab', 'exercise', 'seminar', 'tutorial'], {
  error: 'Ungültige oder fehlende Kursart'
})

export type CourseType = z.infer<typeof courseTypeSchema>

export const semesterPlanTypeSchema = z.enum([
  'exam',
  'lecture',
  'block',
  'project',
  'closed_building',
  'self_study',
  'semester_break'
])

export type SemesterPlanType = z.infer<typeof semesterPlanTypeSchema>

export const schedulePoSchema = z.object({
  po: z.string().trim().min(1),
  specialization: z.string().trim().min(1).nullable(),
  recommendedSemester: z.array(z.number()),
  mandatory: z.boolean()
})

export type PO = z.infer<typeof schedulePoSchema>

export function clonePOs(pos: PO[]): PO[] {
  return pos.map((po) => ({
    ...po,
    recommendedSemester: [...po.recommendedSemester]
  }))
}

/**
 * Collapses PO entries that share study program, PO, specialization and mandatory flag into a
 * single entry with the union of their recommended semesters. The backend reports one entry per
 * generic module option, so a module chosen by several generic modules of the same PO arrives
 * multiple times.
 */
export function mergePOs(pos: PO[]): PO[] {
  const merged: PO[] = []
  for (const { po, specialization, mandatory, recommendedSemester } of pos) {
    let entry = merged.find(
      (m) => m.po === po && m.specialization === specialization && m.mandatory === mandatory
    )
    if (!entry) {
      entry = { po, specialization, mandatory, recommendedSemester: [] }
      merged.push(entry)
    }
    for (const semester of recommendedSemester) {
      // 0 carries no recommendation and cannot be selected in the picker
      if (semester > 0 && !entry.recommendedSemester.includes(semester)) {
        entry.recommendedSemester.push(semester)
      }
    }
  }
  for (const entry of merged) {
    entry.recommendedSemester.sort((a, b) => a - b)
  }
  return merged
}

export function arraysEqual(lhs: string[], rhs: string[]): boolean {
  if (lhs.length !== rhs.length) return false
  const sortedA = [...lhs].sort()
  const sortedB = [...rhs].sort()
  return sortedA.every((val, index) => val === sortedB[index])
}

export function posEqual(lhs: PO[], rhs: PO[]): boolean {
  function poKey({ po, specialization, mandatory }: PO): string {
    return `${specialization ?? po}-${mandatory}`
  }

  if (lhs.length !== rhs.length) return false
  const sortL = [...lhs].sort((a, b) => poKey(a).localeCompare(poKey(b)))
  const sortR = [...rhs].sort((a, b) => poKey(a).localeCompare(poKey(b)))
  return sortL.every((l, i) => {
    const r = sortR[i]
    const semestersL = [...l.recommendedSemester].sort((a, b) => a - b)
    const semestersR = [...r.recommendedSemester].sort((a, b) => a - b)
    return (
      l.po === r.po &&
      l.specialization === r.specialization &&
      l.mandatory === r.mandatory &&
      semestersL.length === semestersR.length &&
      semestersL.every((v, j) => v === semestersR[j])
    )
  })
}

// Remote-function and backend-request inputs
const scheduleEntryTimeFields = {
  start: z.date(),
  end: z.date()
}

// Note(BK5B4D): Write-input fields are a twin of Note(BK5B4D) teachingBookingInputSchema
// in schemas/booking.ts. Keep module/courseType/rooms/po/lecturer/series/date
// constraints in sync.
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

/** Shared frontend create model for live schedule entries and schedule plan draft entries. */
export type ScheduleEntryCreate = z.infer<typeof scheduleEntryInputSchema>
/** Shared frontend edit model for live schedule entries and schedule plan draft entries. */
export type ScheduleEntryEdit = z.infer<typeof updateScheduleEntryInputSchema>

export type ScheduleEntryUpdateScope = 'single' | 'series'

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
export const backendDateTimeResponseSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))

export const scheduleManagementResponseSchema = z.object({
  id: z.string().trim().min(1),
  kind: z.enum(['person', 'group', 'unknown']),
  label: z.string().trim().min(1),
  abbreviation: z.string().trim().min(1)
})

export type ModuleManagement = z.infer<typeof scheduleManagementResponseSchema>

export const scheduleRoomResponseSchema = z.object({
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

/**
 * Shared frontend read model for live schedule entries and schedule plan draft entries.
 * A draft's plan draft ID remains server-side context and is intentionally not part of this model.
 */
export type ScheduleEntry = z.infer<typeof scheduleEntryResponseSchema>

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

export type SeriesOccurrence = z.infer<typeof scheduleSeriesOccurrenceResponseSchema>

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
    type: semesterPlanTypeSchema,
    teachingUnit: z.string().trim().min(1).nullable(),
    teachingUnitLabel: z.string().trim().min(1).nullable(),
    semesterIndex: z.array(z.number().int()).nullable(),
    phase: z.string().nullable()
  })
)

export type SemesterPlanEntry = z.infer<typeof semesterPlanEntryListResponseSchema>[number]

// Client-side forms
export const scheduleEntryFormFields = {
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
}

export const scheduleEntryFormSchema = z.object(scheduleEntryFormFields)

export type ScheduleEntryFormData = z.infer<typeof scheduleEntryFormSchema>

export const scheduleEntryPoFormSchema = z.object({
  fullPOId: z.string().min(1, 'Studiengang erforderlich'),
  recommendedSemester: z.array(z.number()),
  mandatory: z.boolean()
})
