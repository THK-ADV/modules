import { z } from 'zod/v4'

export const moduleCatalogFormSchema = z.object({
  genericModules: z.array(z.string()).default([])
})

export const examListReleaseFormSchema = z.object({
  semester: z.string().nonempty('Semester ist erforderlich'),
  releaseDate: z.date({ error: 'Datum ist erforderlich' })
})

export const examListReleaseRequestSchema = z.object({
  semester: z.string().trim().min(1),
  date: z.iso.datetime({ offset: true }),
  studyProgram: z.string().trim().min(1),
  po: z.string().trim().min(1)
})

export const documentPreviewKindSchema = z.enum([
  'moduleCatalog',
  'moduleCatalog_creation',
  'examList',
  'examLoad'
])

export type DocumentPreviewKind = z.infer<typeof documentPreviewKindSchema>

export const documentPreviewQuerySchema = z.object({
  po: z.string().trim().min(1),
  studyProgram: z.string().trim().min(1)
})

export const moduleCatalogRequestSchema = z.array(z.string().trim().min(1))
