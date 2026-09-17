/** Mirrors the backend `Semester.of`: summer semester from March to August, winter otherwise. */
export function semesterIdOf(date: Date): string {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  if (month >= 3 && month <= 8) return `sose_${year}`
  return month < 3 ? `wise_${year - 1}` : `wise_${year}`
}

export interface Semester {
  id: string
  year: number
  abbrev: string
  deLabel: string
  start: string // LocalDate, formatted as YYYY-MM-DD
  end: string // LocalDate, formatted as YYYY-MM-DD
}
