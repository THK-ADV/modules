import { z } from 'zod/v4'
import { studyProgramSchema } from './study-program'

/** Module manager of `/modules?extend=true`; missing names and abbreviations are empty. */
export const personShortSchema = z.object({
  id: z.string(),
  abbreviation: z.string(),
  kind: z.enum(['person', 'group', 'unknown']),
  title: z.string(),
  firstname: z.string(),
  lastname: z.string()
})

export const studyProgramModuleAssociationSchema = z.object({
  studyProgram: studyProgramSchema,
  mandatory: z.boolean(),
  recommendedSemester: z.array(z.number().int())
})

/** Published module of `/modules?extend=true` with its managers and study programs. */
export const moduleViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  abbrev: z.string(),
  ects: z.number(),
  status: z.string(),
  moduleManagement: z.array(personShortSchema),
  studyProgram: z.array(studyProgramModuleAssociationSchema)
})

/** Date of the latest change to the published modules, without an offset; `null` if unknown. */
export const latestModuleUpdateSchema = z.iso.datetime({ local: true }).nullable()

export type IdentityKind = z.infer<typeof personShortSchema>['kind']
export type PersonShort = z.infer<typeof personShortSchema>
export type StudyProgramModuleAssociation = z.infer<typeof studyProgramModuleAssociationSchema>
export type ModuleViewJson = z.infer<typeof moduleViewSchema>

export interface ModuleType {
  id: 'pm' | 'wm' | 'pwm'
  label: string
  abbrev: string
}

export interface ModuleView extends ModuleViewJson {
  moduleType: ModuleType | undefined
}
