export interface Semester {
  id: string
  year: number
  abbrev: string
  deLabel: string
  start: string // LocalDate, formatted as YYYY-MM-DD
  end: string // LocalDate, formatted as YYYY-MM-DD
}
