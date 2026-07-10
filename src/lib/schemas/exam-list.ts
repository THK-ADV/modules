import { z } from 'zod/v4'

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
