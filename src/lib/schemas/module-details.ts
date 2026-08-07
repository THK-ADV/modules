import { MODULE_DRAFT_STATES } from '$lib/types/module-draft'
import { z } from 'zod/v4'

export const moduleDraftStateResponseSchema = z.object({ id: z.enum(MODULE_DRAFT_STATES) })

const moduleShortResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  abbreviation: z.string()
})

const identityResponseSchema = z.union([
  z.object({
    kind: z.literal('person'),
    id: z.string(),
    title: z.string(),
    imageUrl: z.string().nullable().optional(),
    websiteUrl: z.string().nullable(),
    isActive: z.boolean(),
    firstname: z.string().nullable(),
    lastname: z.string().nullable(),
    abbreviation: z.string().nullable(),
    employmentType: z.string().nullable(),
    faculties: z.array(z.string())
  }),
  z.object({
    kind: z.enum(['group', 'unknown']),
    id: z.string(),
    title: z.string(),
    isActive: z.boolean()
  })
])

const poMandatoryResponseSchema = z.object({
  poId: z.string(),
  poVersion: z.number(),
  poECTSFactor: z.number(),
  studyProgramId: z.string(),
  studyProgramLabel: z.string(),
  studyProgramAbbreviation: z.string(),
  degree: z.string(),
  specializationLabel: z.string().nullable(),
  specializationAbbrev: z.string().nullable(),
  recommendedSemester: z.array(z.number())
})

const prerequisiteResponseSchema = z
  .object({ text: z.string(), modules: z.array(moduleShortResponseSchema) })
  .nullable()

const contentResponseSchema = z.object({
  learningOutcome: z.string(),
  moduleContent: z.string(),
  learningMethods: z.string(),
  literature: z.string(),
  particularities: z.string()
})

export const moduleDetailResponseSchema = z.object({
  id: z.string(),
  lastModified: z.string(),
  title: z.string(),
  abbreviation: z.string(),
  ects: z.number(),
  moduleType: z.object({ id: z.string(), label: z.string() }),
  language: z.object({ id: z.string(), label: z.string() }),
  duration: z.number(),
  season: z.string(),
  status: z.object({ id: z.string(), label: z.string() }),
  location: z.string(),
  examPhases: z.array(z.string()),
  firstExaminer: identityResponseSchema,
  secondExaminer: identityResponseSchema,
  workload: z.object({
    lecture: z.number(),
    seminar: z.number(),
    practical: z.number(),
    exercise: z.number(),
    projectSupervision: z.number(),
    projectWork: z.number()
  }),
  participants: z.object({ min: z.number(), max: z.number() }).nullable(),
  moduleManagement: z.array(identityResponseSchema),
  lecturer: z.array(identityResponseSchema),
  assessments: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      source: z.string(),
      percentage: z.number().nullable(),
      preconditions: z.array(z.string())
    })
  ),
  poMandatory: z.array(poMandatoryResponseSchema),
  poOptional: z.array(
    poMandatoryResponseSchema.extend({
      instanceOf: moduleShortResponseSchema
    })
  ),
  taughtWith: z.array(moduleShortResponseSchema),
  requiredPrerequisites: prerequisiteResponseSchema,
  recommendedPrerequisites: prerequisiteResponseSchema,
  deContent: contentResponseSchema,
  enContent: contentResponseSchema,
  moduleRelation: z
    .object({ relationType: z.literal('parent'), modules: z.array(moduleShortResponseSchema) })
    .nullable(),
  assessmentPrerequisite: z.object({ modules: z.string(), reason: z.string() }).nullable(),
  attendanceRequirement: z
    .object({ min: z.string(), reason: z.string(), absence: z.string() })
    .nullable()
})

export type ModuleDetail = z.infer<typeof moduleDetailResponseSchema>
export type ModuleShort = z.infer<typeof moduleShortResponseSchema>
export type GenericModuleOption = ModuleShort & { status: string }
export type Prerequisite = NonNullable<ModuleDetail['requiredPrerequisites']>
export type POMandatory = ModuleDetail['poMandatory'][number]
export type Identity = ModuleDetail['firstExaminer']
export type Person = Extract<Identity, { kind: 'person' }>
export type Other = Exclude<Identity, Person>
export type Assessment = ModuleDetail['assessments'][number]
export type AssessmentPrerequisite = NonNullable<ModuleDetail['assessmentPrerequisite']>
export type AttendanceRequirement = NonNullable<ModuleDetail['attendanceRequirement']>
