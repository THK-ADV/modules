import type { Semester } from './schemas/semester'
import type { Identity, ModuleManagement } from './types/core'
import type { IdentityKind, PersonShort } from './types/module'
import type { StudyProgram } from './types/study-program'

export const TIME_ZONE = 'Europe/Berlin'

export function ordinalKind(kind: IdentityKind): number {
  switch (kind) {
    case 'person':
      return 0
    case 'group':
      return 1
    case 'unknown':
      return 2
  }
}

const collator = new Intl.Collator('de')

function compareByKind<T extends { kind: IdentityKind }>(
  a: T,
  b: T,
  label: (x: T) => string
): number {
  return a.kind === b.kind
    ? collator.compare(label(a), label(b))
    : ordinalKind(a.kind) - ordinalKind(b.kind)
}

export function peopleOrdering(a: Identity, b: Identity): number {
  return compareByKind(a, b, (x) =>
    x.kind === 'person' ? x.lastname : x.kind === 'group' ? x.label : x.id
  )
}

export function peopleShortOrdering(a: PersonShort, b: PersonShort): number {
  return compareByKind(a, b, (x) =>
    x.kind === 'person' ? x.lastname : x.kind === 'group' ? x.title : x.id
  )
}

export function fmtStudyProgram(sp: StudyProgram) {
  const degree = sp.degree.deLabel.charAt(0)
  return `${fmtStudyProgramName(sp)} (${degree}., PO ${sp.po.version})`
}

export function fmtStudyProgramName(sp: StudyProgram) {
  return sp.specialization ? `${sp.deLabel} ${sp.specialization.deLabel}` : sp.deLabel
}

export function fmtStudyProgramBadge(sp: StudyProgram) {
  const specId = sp.specialization?.id
  const prefix = specId
    ? `${sp.abbreviation}-${specId.slice(specId.lastIndexOf('_') + 1).toUpperCase()}`
    : sp.abbreviation
  return `${prefix} · PO${sp.po.version}`
}

export function fmtStudyProgramWithoutPO(studyProgram: StudyProgram) {
  return `${fmtStudyProgramName(studyProgram)} (${studyProgram.degree.deLabel})`
}

export function fmtSemester(semester: Pick<Semester, 'deLabel' | 'year'>): string {
  return `${semester.deLabel} ${semester.year}`
}

export function fmtSemesterShort(semester: Pick<Semester, 'abbrev' | 'year'>): string {
  return `${semester.abbrev.toUpperCase()} ${semester.year}`
}

export function fmtPersonName(person: { lastname: string; firstname: string }): string {
  return person.firstname ? `${person.lastname}, ${person.firstname}` : person.lastname
}

export function fmtPersonInitial(person: { lastname: string; firstname: string }): string {
  return person.firstname ? `${person.lastname}, ${person.firstname.charAt(0)}.` : person.lastname
}

export function fmtPerson(p: Identity): string {
  switch (p.kind) {
    case 'person':
      return fmtPersonName(p)
    case 'group':
      return p.label
    case 'unknown':
      return p.label
  }
}

export function fmtPersonShort(p: Identity): string {
  switch (p.kind) {
    case 'person':
      return p.abbreviation
    case 'group':
      return p.id.toUpperCase()
    case 'unknown':
      return p.id.toUpperCase()
  }
}

export function fmtManagement(m: ModuleManagement): string {
  const lastname = m.lastname?.trim() ?? ''
  const firstname = m.firstname?.trim() ?? ''

  switch (m.kind) {
    case 'person':
      return lastname || firstname || m.id
    case 'group':
      return lastname || m.id
    case 'unknown':
      return 'N.N.'
  }
}

const creditsFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 })

export function fmtCredits(value: number): string {
  return creditsFormatter.format(value)
}

const dateFormat = (options: Intl.DateTimeFormatOptions) => {
  const formatter = new Intl.DateTimeFormat('de-DE', { timeZone: TIME_ZONE, ...options })
  return (value: string | Date): string => formatter.format(new Date(value))
}

export const fmtDate = dateFormat({ dateStyle: 'medium' }) // 05.01.2026
export const fmtDateLong = dateFormat({ dateStyle: 'long' }) // 5. Januar 2026
export const fmtDateTime = dateFormat({ dateStyle: 'medium', timeStyle: 'short' }) // 05.01.2026, 14:30
export const fmtTime = dateFormat({ timeStyle: 'short' }) // 14:30
// Mo., 05.01.2026
export const fmtWeekdayDate = dateFormat({
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})
