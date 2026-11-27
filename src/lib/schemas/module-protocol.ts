import { z } from 'zod/v4'

const poRelationSchema = z.object({
  po: z.string(),
  specialization: z.string().nullable(),
  recommendedSemester: z.array(z.number())
})

const prerequisiteEntrySchema = z.object({ text: z.string(), modules: z.array(z.string()) })

const contentSchema = z.object({
  learningOutcome: z.string(),
  content: z.string(),
  teachingAndLearningMethods: z.string(),
  recommendedReading: z.string(),
  particularities: z.string()
})

/** Module of `/modules/:id/latest` and `/modules/:id` without `extend`, as written by the backend. */
export const moduleProtocolSchema = z.object({
  id: z.string().optional(), // missing if a module draft exists
  metadata: z.object({
    title: z.string(),
    abbrev: z.string(),
    moduleType: z.string(),
    ects: z.number(),
    language: z.string(),
    duration: z.number(),
    season: z.string(),
    workload: z.object({
      lecture: z.number(),
      seminar: z.number(),
      practical: z.number(),
      exercise: z.number(),
      projectSupervision: z.number(),
      projectWork: z.number()
    }),
    status: z.string(),
    location: z.string(),
    participants: z.object({ min: z.number(), max: z.number() }).nullable(),
    moduleRelation: z
      .object({ kind: z.literal('parent'), children: z.array(z.string()) })
      .nullable(),
    moduleManagement: z.array(z.string()),
    lecturers: z.array(z.string()),
    assessmentMethods: z.object({
      mandatory: z.array(
        z.object({
          method: z.string(),
          percentage: z.number().nullable(),
          precondition: z.array(z.string())
        })
      )
    }),
    examiner: z.object({ first: z.string(), second: z.string() }),
    examPhases: z.array(z.string()),
    prerequisites: z.object({
      recommended: prerequisiteEntrySchema.nullable(),
      required: prerequisiteEntrySchema.nullable()
    }),
    po: z.object({
      mandatory: z.array(
        poRelationSchema.extend({ recommendedSemesterPartTime: z.number().nullable() })
      ),
      optional: z.array(
        poRelationSchema.extend({ instanceOf: z.string(), partOfCatalog: z.boolean() })
      )
    }),
    taughtWith: z.array(z.string()),
    attendanceRequirement: z
      .object({ min: z.string(), reason: z.string(), absence: z.string() })
      .nullable(),
    assessmentPrerequisite: z.object({ modules: z.string(), reason: z.string() }).nullable()
  }),
  deContent: contentSchema,
  enContent: contentSchema
})

export type ModuleProtocol = z.infer<typeof moduleProtocolSchema>
export type MetadataProtocol = ModuleProtocol['metadata']
export type AssessmentEntry = MetadataProtocol['assessmentMethods']['mandatory'][number]
export type POMandatory = MetadataProtocol['po']['mandatory'][number]
export type POOptional = MetadataProtocol['po']['optional'][number]
