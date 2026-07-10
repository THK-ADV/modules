import { z } from 'zod/v4'

export const examListReleaseFormSchema = z.object({
  semester: z.string().nonempty('Semester ist erforderlich'),
  releaseDate: z.date({ error: 'Datum ist erforderlich' })
})

export const examListReleaseRequestSchema = z.object({
  semester: z.string().trim().min(1),
  date: z.iso.datetime({ offset: true }),
  po: z.string().trim().min(1)
})
