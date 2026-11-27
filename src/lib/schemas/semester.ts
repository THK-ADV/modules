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

/** Mirrors the backend `Semester.of`: summer semester from March to August, winter otherwise. */
export function semesterIdOf(value: Date | string | number): string {
  const date = new Date(value)
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  if (month >= 3 && month <= 8) return `sose_${year}`
  return month < 3 ? `wise_${year - 1}` : `wise_${year}`
}
