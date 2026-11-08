import { z } from 'zod/v4'
import { identityRefSchema, moduleRefSchema } from './exam-planning'

const examModuleSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  abbrev: z.string(),
  ects: z.number(),
  status: z.string(),
  firstExaminer: identityRefSchema
})
export type ExamModule = z.infer<typeof examModuleSchema>

/** Exam with its modules; `modules` may be empty after the last module was removed. */
export const examSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  assessmentMethods: z.array(z.string()),
  modules: z.array(examModuleSchema)
})
export type Exam = z.infer<typeof examSchema>

/** Exam to choose for an appointment, with only what the choice shows and the appointment needs. */
export const examChoiceSchema = examSchema
  .pick({ id: true, name: true, assessmentMethods: true })
  .extend({ modules: z.array(moduleRefSchema) })
export type ExamChoice = z.infer<typeof examChoiceSchema>

/** All exams and the active modules with own exams that have none assigned. */
export const examsSchema = z.object({
  exams: z.array(examSchema),
  modulesWithoutExam: z.array(examModuleSchema)
})

const examName = z
  .string()
  .trim()
  .min(1, 'Der Name darf nicht leer sein.')
  .refine((name) => !/[\r\n]/.test(name), 'Der Name darf keine Zeilenumbrüche enthalten.')

/** Name and modules of an exam to create or replace. */
export const examWriteSchema = z.object({
  name: examName,
  modules: z.array(z.uuid()).min(1, 'Mindestens ein Modul auswählen.')
})

/** Merges the sources into the target, which keeps its id and gets the name. */
export const examMergeSchema = z.object({
  target: z.uuid(),
  sources: z.array(z.uuid()).min(1),
  name: examName
})
