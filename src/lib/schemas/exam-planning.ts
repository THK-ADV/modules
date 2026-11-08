import { z } from 'zod/v4'
import { coreDataSchemas } from './core-data'
import { examListLabelSchemas } from './exam-list'
import { planDraftWithSemesterResponseSchema } from './plan-draft'
import { studyProgramSchema } from './study-program'

const count = z.number().int().nonnegative()

/** Exam plan draft with its semester and whether it differs from the published appointments. */
export const examPlanSchema = planDraftWithSemesterResponseSchema.extend({
  hasUnpublishedChanges: z.boolean()
})
export type ExamPlan = z.infer<typeof examPlanSchema>

/** Resolved identity of an examiner or invigilator; `label` is the last name of a person. */
export const identityRefSchema = z.object({
  id: z.string(),
  kind: z.string(),
  label: z.string(),
  abbreviation: z.string()
})
export type IdentityRef = z.infer<typeof identityRefSchema>

const examPoSchema = z.object({
  po: z.string(),
  specialization: z.string().nullable(),
  recommendedSemester: z.array(z.number().int()),
  mandatory: z.boolean()
})
export type ExamPO = z.infer<typeof examPoSchema>

/** Empty `phases` and `assessmentMethods` match any. */
export const examPoolSelectionSchema = z.object({
  semester: z.string().regex(/^(sose|wise)_\d{4}$/),
  phases: z.array(z.string()),
  assessmentMethods: z.array(z.string())
})

/**
 * Pool selection and the person ids automatic invigilator assignment chooses from; an empty list
 * assigns nobody. Older configurations have no `availableInvigilators`.
 */
export const examPoolConfigSchema = examPoolSelectionSchema.extend({
  availableInvigilators: z.array(z.string()).default([])
})
export type ExamPoolConfig = z.infer<typeof examPoolConfigSchema>

export const moduleRefSchema = z.object({ id: z.uuid(), title: z.string(), abbrev: z.string() })

/** Exam list row of one PO an offer is taken from; examiners are identity ids. */
const examSourceSchema = z.object({
  examListEntry: z.uuid(),
  examList: z.uuid(),
  po: z.string(),
  date: z.iso.date(),
  module: z.uuid(),
  moduleTitle: z.string(),
  moduleAbbrev: z.string(),
  firstExaminer: z.string(),
  secondExaminer: z.string(),
  assessmentMethods: z.array(z.string()),
  registrationPeriod: z.object({
    start: z.iso.date().nullable(),
    end: z.iso.date().nullable()
  })
})
export type ExamSource = z.infer<typeof examSourceSchema>

/** Published exam `(exam, phase)` without appointment yet, with the live name and modules of the exam. */
export const examOfferSchema = z.object({
  exam: z.uuid(),
  examName: z.string(),
  phase: z.string(),
  modules: z.array(moduleRefSchema),
  firstExaminers: z.array(identityRefSchema),
  assessmentMethods: z.array(z.string()),
  sources: z.array(examSourceSchema)
})
export type ExamOffer = z.infer<typeof examOfferSchema>

const examRoomSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  abbrev: z.string(),
  /** Criterion and value of the participants sitting in this room, e.g. `Nachname` and `A-Me`. */
  partitionBy: z.string().nullable(),
  partitionValue: z.string().nullable(),
  invigilators: z.array(identityRefSchema)
})

/** Exam appointment with the live data of its exam and modules, shared by drafts and published ones. */
const examEntryBaseSchema = z.object({
  id: z.uuid(),
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }),
  examName: z.string(),
  assessmentMethod: z.string().nullable(),
  modules: z.array(
    moduleRefSchema.extend({ ects: z.number(), firstExaminer: identityRefSchema.nullable() })
  ),
  po: z.array(examPoSchema),
  rooms: z.array(examRoomSchema)
})
export type ExamEntry = z.infer<typeof examEntryBaseSchema>

/** Published exam appointment with the teaching units of its modules for filtering. */
export const publishedExamEntrySchema = examEntryBaseSchema.extend({
  teachingUnits: z.array(z.uuid())
})
export type PublishedExamEntry = z.infer<typeof publishedExamEntrySchema>

/** Exam appointment of an exam plan draft with its planning data, which is not published. Unknown counts are `null`. */
export const examEntryDraftSchema = examEntryBaseSchema.extend({
  exam: z.uuid(),
  phase: z.string(),
  expectedParticipants: count.nullable(),
  modules: z.array(
    examEntryBaseSchema.shape.modules.element.extend({ assessmentMethods: z.array(z.string()) })
  ),
  rooms: z.array(
    examRoomSchema.extend({
      examCapacityOpt: count.nullable(),
      examCapacityMax: count.nullable(),
      allocatedSeats: count.nullable(),
      requiredInvigilators: count.nullable()
    })
  )
})
export type ExamEntryDraft = z.infer<typeof examEntryDraftSchema>

const timesSchema = z
  .object({
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    assessmentMethod: z.string().min(1).nullable(),
    expectedParticipants: count.nullable()
  })
  .refine(
    ({ start, end }) => Date.parse(end) > Date.parse(start),
    'Das Ende muss nach dem Beginn liegen'
  )
export type ExamEntryTimes = z.infer<typeof timesSchema>

export const examEntryCreateSchema = z.object({
  draftId: z.uuid(),
  entry: z
    .object({ exam: z.uuid(), phase: z.string(), assessmentMethod: z.string().min(1) })
    .and(timesSchema)
})

export const examEntryUpdateSchema = z.object({
  draftId: z.uuid(),
  id: z.uuid(),
  times: timesSchema
})

/** Trimmed text, `null` if blank. */
const optionalText = z
  .string()
  .nullable()
  .transform((s) => s?.trim() || null)

/**
 * Unique invigilators, at most `requiredInvigilators` if known. The participant partition is
 * either unspecified or both its criterion and value are given.
 */
const examRoomAllocationSchema = z
  .object({
    room: z.uuid(),
    allocatedSeats: count.nullable(),
    requiredInvigilators: count.nullable(),
    partitionBy: optionalText,
    partitionValue: optionalText,
    invigilators: z.array(z.string())
  })
  .refine(
    ({ requiredInvigilators, invigilators }) =>
      new Set(invigilators).size === invigilators.length &&
      (requiredInvigilators === null || invigilators.length <= requiredInvigilators),
    'Mehr Aufsichtspersonen als benötigt'
  )
  .refine(
    ({ partitionBy, partitionValue }) => (partitionBy === null) === (partitionValue === null),
    'Aufteilung nach und Bereich gemeinsam angeben'
  )
export type ExamRoomAllocation = z.infer<typeof examRoomAllocationSchema>

export const examRoomsUpdateSchema = z.object({
  draftId: z.uuid(),
  id: z.uuid(),
  rooms: z.array(examRoomAllocationSchema)
})

/** Rooms of appointments whose open invigilator demand is filled automatically. */
export const invigilatorAssignmentSchema = z.object({
  draftId: z.uuid(),
  rooms: z.array(z.object({ entry: z.uuid(), room: z.uuid() })).min(1)
})

/** Labels and options of the ids used by exam plans, from the public core data endpoints. */
export const examPlanningLabelSchemas = {
  examPhases: examListLabelSchemas.examPhases,
  assessmentMethods: examListLabelSchemas.assessmentMethods,
  identities: z.array(
    z.union([
      z.object({
        id: z.string(),
        kind: z.literal('person'),
        firstname: z.string(),
        lastname: z.string(),
        abbreviation: z.string(),
        isActive: z.boolean()
      }),
      z.object({ id: z.string(), kind: z.string(), label: z.string() })
    ])
  ),
  rooms: z.array(coreDataSchemas.rooms.omit({ type: true, capacity: true })),
  studyPrograms: z.array(studyProgramSchema)
}
