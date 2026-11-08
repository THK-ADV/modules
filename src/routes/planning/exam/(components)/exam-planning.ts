import { getExamEntries, type getExamPlanningLabels } from '../exam-planning.remote'
import type { ExamEntryDraft } from '$lib/schemas/exam-planning'
import type { Semester } from '$lib/schemas/semester'
import { fmtSemester, TIME_ZONE } from '$lib/formats'
import { fromDate, parseDateTime, toCalendarDateTime } from '@internationalized/date'

/** Text-only outline state badges as used on admin pages. */
export const stateBadge = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300',
  changed:
    'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300',
  destructive:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300'
} as const

/** Label of a semester id such as `wise_2026`, the id itself if it is unknown. */
export function semesterLabel(id: string, semesters: Semester[]): string {
  const semester = semesters.find((s) => s.id === id)
  return semester ? fmtSemester(semester) : id
}

/** Chronological sort key of a semester id. */
export function semesterOrder(id: string): number {
  const [kind, year] = id.split('_')
  return Number(year) * 2 + (kind === 'wise' ? 1 : 0)
}

/** Singular or plural noun with its count, e.g. `1 Termin`, `3 Termine`. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/**
 * Puts a saved appointment into the cached appointments of its plan, or removes it without one, based on the current
 * cache rather than a rendered copy, so that concurrent saves keep each other's results. A plan without cached
 * appointments loads them fresh anyway. Returns whether the appointment is new.
 */
export function putEntry(draftId: string, id: string, entry?: ExamEntryDraft): boolean {
  const query = getExamEntries(draftId)
  const current = query.current
  if (current)
    query.set(
      [...current.filter((e) => e.id !== id), ...(entry ? [entry] : [])].toSorted(
        (a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id)
      )
    )
  return !current?.some((e) => e.id === id)
}

/** Identifies an exam offer and the appointments planned for it. */
export function offerKey(o: { exam: string; phase: string }): string {
  return JSON.stringify([o.exam, o.phase])
}

/** An unambiguous assessment method of an exam, preferring the ones selected for the pool, else `null`. */
export function preselectMethod(methods: string[], preferred: string[]): string | null {
  const matching = methods.filter((id) => preferred.includes(id))
  return matching.length === 1 ? matching[0] : methods.length === 1 ? methods[0] : null
}

export type PlanningLabels = Awaited<ReturnType<typeof getExamPlanningLabels>>

/** Lookup maps of the labels; persons are named by their last name like examiners of appointments. */
export function labelMaps(labels: PlanningLabels) {
  return {
    phases: new Map(labels.examPhases.map((p) => [p.id, p.label])),
    methods: new Map(labels.assessmentMethods.map((m) => [m.id, m.deLabel])),
    identities: new Map(
      labels.identities.map((i) => [i.id, 'lastname' in i ? i.lastname : i.label])
    ),
    rooms: new Map(labels.rooms.map((r) => [r.id, r]))
  }
}
export type LabelMaps = ReturnType<typeof labelMaps>

/** Date `YYYY-MM-DD` and time `HH:mm` of an instant in Germany, independent of the browser's time zone. */
export function berlinParts(value: string | Date): { date: string; time: string } {
  const local = toCalendarDateTime(fromDate(new Date(value), TIME_ZONE)).toString()
  return { date: local.slice(0, 10), time: local.slice(11, 16) }
}

/** Instant with explicit UTC offset of a date and time in Germany. */
export function berlinInstant(date: string, time: string): string {
  return parseDateTime(`${date}T${time}`).toDate(TIME_ZONE).toISOString()
}

/** Whether the value is unknown (`null`) or a non-negative integer. */
export function isCount(value: number | null): boolean {
  return value === null || (Number.isInteger(value) && value >= 0)
}

/** Invigilators of a room and how many it needs, `null` while unknown. */
export interface Staffing {
  requiredInvigilators: number | null
  invigilators: string[]
}

/** Open positions of a room, `null` if its demand is unknown; surplus persons count as none. */
export function openPositions({ requiredInvigilators: n, invigilators }: Staffing): number | null {
  return n === null ? null : Math.max(0, n - invigilators.length)
}

/** Why a room's staffing cannot be saved, if it is invalid. */
export function staffingError({ requiredInvigilators: n, invigilators }: Staffing, room: string) {
  if (!isCount(n)) return `${room}: Benötigte Aufsichten als ganze Zahl ab 0 angeben.`
  if (n !== null && invigilators.length > n)
    return `${room}: ${plural(invigilators.length, 'Aufsichtsperson', 'Aufsichtspersonen')} eingeteilt, aber nur ${n} benötigt.`
}

/** Key of one invigilation duty, a person in a room of an appointment. */
export const dutyKey = (entry: string, room: string, person: string) => `${entry}/${room}/${person}`

/**
 * Keys of duties that overlap another duty of the same person, also in another room of the same
 * appointment. Consecutive appointments do not overlap.
 */
export function overlappingDuties(
  appointments: { id: string; start: string; end: string; rooms: ({ room: string } & Staffing)[] }[]
): Set<string> {
  const byPerson = new Map<string, { key: string; start: number; end: number }[]>()
  for (const a of appointments) {
    const start = Date.parse(a.start)
    const end = Date.parse(a.end)
    for (const r of a.rooms)
      for (const person of r.invigilators) {
        const duty = { key: dutyKey(a.id, r.room, person), start, end }
        const list = byPerson.get(person)
        if (list) list.push(duty)
        else byPerson.set(person, [duty])
      }
  }
  const overlapping = new Set<string>()
  for (const list of byPerson.values()) {
    list.sort((a, b) => a.start - b.start)
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length && list[j].start < list[i].end; j++) {
        overlapping.add(list[i].key)
        overlapping.add(list[j].key)
      }
  }
  return overlapping
}

/** Criterion and value of the participants of a room, both `null` while unspecified. */
export interface Partition {
  partitionBy: string | null
  partitionValue: string | null
}

/** Trimmed partition, blank fields as `null`. */
export const trimPartition = ({ partitionBy, partitionValue }: Partition): Partition => ({
  partitionBy: partitionBy?.trim() || null,
  partitionValue: partitionValue?.trim() || null
})

/** Whether exactly one of criterion and value is given, which cannot be saved. */
export function partialPartition(p: Partition): boolean {
  const { partitionBy, partitionValue } = trimPartition(p)
  return (partitionBy === null) !== (partitionValue === null)
}

/** Whether a room of an appointment with several rooms lacks its partition. */
export function missingPartition(p: Partition, roomCount: number): boolean {
  const { partitionBy, partitionValue } = trimPartition(p)
  return roomCount > 1 && (partitionBy === null || partitionValue === null)
}
