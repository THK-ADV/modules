import type { CourseType, ScheduleEntryEdit } from '$lib/types/schedule'
import { z } from 'zod/v4'

export type ScheduleEntryWritePayload = Omit<ScheduleEntryEdit, 'id' | 'start' | 'end'> & {
  start: string
  end: string
}

export function createNonEmptyStringSchema() {
  return z.string().trim().min(1)
}

export function createDateTimeStringSchema() {
  return createNonEmptyStringSchema().refine(
    (value) => !Number.isNaN(Date.parse(value)),
    'Ungültiges Datum'
  )
}

export function createDateSchema() {
  // Backend JSON dates arrive as strings; z.date() only accepts already-created Date instances.
  return z.union([createNonEmptyStringSchema(), z.date()]).pipe(z.coerce.date())
}

export function createCourseTypeSchema() {
  return z.enum(['lecture', 'lab', 'exercise', 'seminar', 'tutorial'] satisfies [
    CourseType,
    ...CourseType[]
  ])
}

export function createPoSchema() {
  const nonEmptyStringSchema = createNonEmptyStringSchema()

  return z.object({
    po: nonEmptyStringSchema,
    specialization: nonEmptyStringSchema.nullable(),
    recommendedSemester: z.array(z.number()),
    mandatory: z.boolean()
  })
}

export function createScheduleEntryPropsSchema() {
  return z.object({
    po: z.array(createPoSchema()).min(1),
    lecturer: z.array(createNonEmptyStringSchema())
  })
}

export function createModuleManagementSchema() {
  const nonEmptyStringSchema = createNonEmptyStringSchema()

  return z.object({
    id: nonEmptyStringSchema,
    kind: z.enum(['person', 'group', 'unknown']),
    label: nonEmptyStringSchema,
    abbreviation: nonEmptyStringSchema
  })
}

export function createRoomSchema() {
  const nonEmptyStringSchema = createNonEmptyStringSchema()

  return z.object({
    id: nonEmptyStringSchema,
    abbrev: nonEmptyStringSchema
  })
}

export function createScheduleEntrySchema() {
  const dateSchema = createDateSchema()
  const nonEmptyStringSchema = createNonEmptyStringSchema()
  const moduleManagementSchema = createModuleManagementSchema()

  return z
    .object({
      id: nonEmptyStringSchema,
      start: dateSchema,
      end: dateSchema,
      courseType: createCourseTypeSchema(),
      rooms: z.array(createRoomSchema()).min(1),
      module: nonEmptyStringSchema,
      moduleTitle: nonEmptyStringSchema,
      moduleAbbrev: nonEmptyStringSchema,
      moduleManagement: z.array(moduleManagementSchema),
      lecturer: z.array(moduleManagementSchema),
      teachingUnits: z.array(nonEmptyStringSchema),
      props: createScheduleEntryPropsSchema(),
      seriesId: nonEmptyStringSchema
    })
    .refine(({ start, end }) => end > start, {
      message: 'Ende muss nach Beginn liegen',
      path: ['end']
    })
}

export function createSeriesOccurrenceSchema() {
  const dateSchema = createDateSchema()
  const nonEmptyStringSchema = createNonEmptyStringSchema()

  return z.object({
    id: nonEmptyStringSchema,
    start: dateSchema,
    end: dateSchema
  })
}

export function createScheduleEntryWritePayloadSchema() {
  const nonEmptyStringSchema = createNonEmptyStringSchema()

  return z
    .object({
      module: nonEmptyStringSchema,
      courseType: createCourseTypeSchema(),
      rooms: z.array(nonEmptyStringSchema).min(1),
      props: createScheduleEntryPropsSchema(),
      seriesId: nonEmptyStringSchema,
      start: createDateTimeStringSchema(),
      end: createDateTimeStringSchema()
    })
    .refine(({ start, end }) => Date.parse(end) > Date.parse(start), {
      message: 'Ende muss nach Beginn liegen',
      path: ['end']
    })
}
