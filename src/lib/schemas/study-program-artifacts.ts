import { z } from 'zod/v4'
import { studyProgramSchema } from './study-program'
import { moduleCatalogConfigSchema } from './module-catalog'
import { semesterSchema } from './semester'

export const artifactTargetSchema = z.string().trim().min(1)

export const publishedDocumentSchema = z.object({
  studyProgram: studyProgramSchema,
  semester: semesterSchema,
  date: z.iso.date(),
  url: z.string().min(1)
})

export type PublishedDocument = z.infer<typeof publishedDocumentSchema>

export const studyProgramPrivilegeSchema = z.object({
  studyProgram: studyProgramSchema,
  canPreview: z.boolean(),
  canCreate: z.boolean()
})

export const moduleCatalogIntroductionSchema = z.object({
  po: artifactTargetSchema,
  lastModified: z.iso.datetime({ local: true, offset: true }).transform((value) => new Date(value))
})

export const moduleCatalogRequestSchema = z.object({
  po: artifactTargetSchema,
  config: moduleCatalogConfigSchema
})

export const artifactPreviewSchema = z.discriminatedUnion('document', [
  moduleCatalogRequestSchema.extend({ document: z.literal('moduleCatalog') }),
  z.object({ po: artifactTargetSchema, document: z.enum(['examList', 'examLoad']) })
])

export const INTRODUCTION_FILE_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const moduleCatalogUploadSchema = z.object({
  po: artifactTargetSchema,
  file: z
    .file({ error: 'Bitte eine Word-Datei auswählen' })
    .min(1, 'Bitte eine Datei auswählen')
    .max(10 * 1024 * 1024, 'Maximal 10 MB sind erlaubt')
    .refine(
      (file) => file.type === INTRODUCTION_FILE_TYPE || file.name.toLowerCase().endsWith('.docx'),
      'Nur Word-Dateien (.docx) sind erlaubt'
    )
})

export type StudyProgramManagerInfo = z.infer<typeof studyProgramPrivilegeSchema> & {
  examList?: PublishedDocument
  moduleCatalog?: PublishedDocument
  moduleCatalogIntroLastModified?: Date
}
