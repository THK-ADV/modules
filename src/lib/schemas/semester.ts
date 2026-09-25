import { z } from 'zod/v4'

export const semesterSchema = z.object({
  id: z.string().trim().min(1),
  year: z.number().int(),
  abbrev: z.string().trim().min(1),
  deLabel: z.string().trim().min(1),
  start: z.iso.date(),
  end: z.iso.date()
})

export type Semester = z.infer<typeof semesterSchema>
