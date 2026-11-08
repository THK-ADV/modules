import { goto } from '$app/navigation'
import { examModuleAbbrevs } from '$lib/types/exam-planning'
import { getErrorMessage } from '$lib/errors'
import { fmtWeekdayLong } from '$lib/formats'
import type { ExamEntryDraft, ExamPoolConfig } from '$lib/schemas/exam-planning'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'
import { assignInvigilators, updateExamRooms } from '../../exam-planning.remote'
import {
  dutyKey,
  isCount,
  missingPartition,
  openPositions,
  overlappingDuties,
  plural,
  putEntry,
  stateBadge,
  staffingError,
  type PlanningLabels,
  type Staffing
} from '../exam-planning'

type SavedRoom = ExamEntryDraft['rooms'][number]

const savedStaffing = (r: SavedRoom): Staffing => ({
  requiredInvigilators: r.requiredInvigilators,
  invigilators: r.invigilators.map((i) => i.id)
})
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const roomKey = (entry: string, room: string) => `${entry}/${room}`

const hoursFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
/** Hours of a duration in milliseconds, e.g. `1,5`. */
export const fmtHours = (ms: number) => hoursFormat.format(ms / 3_600_000)

interface Source {
  draftId: string
  config: ExamPoolConfig
  labels: PlanningLabels
  entries: ExamEntryDraft[]
}

/** Staffing of the rooms of an exam plan with unsaved edits, selection and automatic assignment. */
export class Invigilation {
  #source: () => Source

  constructor(source: () => Source) {
    this.#source = source
  }
  #data() {
    return this.#source()
  }

  draftId = $derived(this.#data().draftId)
  config = $derived(this.#data().config)
  labels = $derived(this.#data().labels)
  entries = $derived(this.#data().entries)

  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- immutable derived value
  personById = $derived(new Map(this.labels.persons.map((p) => [p.id, p])))
  /** Labels of invigilators missing in the core data. */
  #labelById = $derived(
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- immutable derived value
    new Map(
      this.entries.flatMap((e) =>
        e.rooms.flatMap((r) => r.invigilators.map((i) => [i.id, i.label]))
      )
    )
  )
  fullName = (id: string) => {
    const p = this.personById.get(id)
    return p ? `${p.lastname}, ${p.firstname}` : (this.#labelById.get(id) ?? id)
  }
  /** `Nachname, V.` */
  shortName = (id: string) => {
    const p = this.personById.get(id)
    if (!p) return this.#labelById.get(id) ?? id
    return p.firstname ? `${p.lastname}, ${p.firstname.charAt(0)}.` : p.lastname
  }

  /** Unsaved staffing per appointment and room; other room fields always come from the saved plan. */
  drafts = $state<Record<string, Record<string, Staffing>>>({})

  /** Appointments by start with their rooms as edited. */
  rows = $derived(
    this.entries
      .map((entry) => {
        const rooms = entry.rooms.map((saved) => ({
          room: saved.id,
          saved,
          ...(this.drafts[entry.id]?.[saved.id] ?? savedStaffing(saved))
        }))
        const dirty = rooms.some(
          (r) =>
            !same(
              { requiredInvigilators: r.requiredInvigilators, invigilators: r.invigilators },
              savedStaffing(r.saved)
            )
        )
        const ms = Date.parse(entry.end) - Date.parse(entry.start)
        return { id: entry.id, start: entry.start, end: entry.end, entry, rooms, dirty, ms }
      })
      .toSorted((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id))
  )
  dirtyCount = $derived(this.rows.filter((r) => r.dirty).length)

  /** Duties overlapping another duty of the same person. */
  overlapping = $derived(overlappingDuties(this.rows))
  /** Duties per person over the whole plan with their total duration and overlaps. */
  workload = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to the derivation
    const byPerson = new Map<
      string,
      {
        count: number
        ms: number
        overlaps: number
        duties: { room: string; start: number; end: number }[]
      }
    >()
    for (const row of this.rows)
      for (const r of row.rooms)
        for (const person of r.invigilators) {
          const w = byPerson.get(person) ?? { count: 0, ms: 0, overlaps: 0, duties: [] }
          w.count++
          w.ms += row.ms
          if (this.overlapping.has(dutyKey(row.id, r.room, person))) w.overlaps++
          w.duties.push({
            room: roomKey(row.id, r.room),
            start: Date.parse(row.start),
            end: Date.parse(row.end)
          })
          byPerson.set(person, w)
        }
    return byPerson
  })
  dutyCount = (id: string) => this.workload.get(id)?.count ?? 0
  dutyMs = (id: string) => this.workload.get(id)?.ms ?? 0
  /** Whether the person has a duty elsewhere overlapping the appointment. */
  busyAt = (id: string, row: Row, room: string) => {
    const start = Date.parse(row.start)
    const end = Date.parse(row.end)
    return (
      this.workload
        .get(id)
        ?.duties.some((d) => d.room !== roomKey(row.id, room) && d.start < end && d.end > start) ??
      false
    )
  }

  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- immutable derived value
  pool = $derived(new Set(this.config.availableInvigilators))
  activeCandidates = $derived(
    this.config.availableInvigilators.filter((id) => this.personById.get(id)?.isActive)
  )
  /** Selected persons and everyone assigned in the plan, least loaded first. */
  roster = $derived(
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- immutable derived value
    [...new Set([...this.config.availableInvigilators, ...this.workload.keys()])]
      .map((id) => ({
        id,
        name: this.fullName(id),
        active: this.personById.get(id)?.isActive ?? false,
        inPool: this.pool.has(id),
        count: this.dutyCount(id),
        ms: this.dutyMs(id),
        overlaps: this.workload.get(id)?.overlaps ?? 0
      }))
      .toSorted((a, b) => a.ms - b.ms || a.count - b.count || a.name.localeCompare(b.name, 'de'))
  )
  maxMs = $derived(Math.max(0, ...this.roster.map((p) => p.ms)))

  /** Open and required positions, rooms without known demand and appointments without room. */
  status = $derived.by(() => {
    let open = 0
    let required = 0
    let unknown = 0
    let assigned = 0
    let staffed = 0
    for (const row of this.rows)
      for (const r of row.rooms) {
        const o = openPositions(r)
        if (o === null) unknown++
        else {
          open += o
          required += r.requiredInvigilators ?? 0
          staffed += Math.min(r.invigilators.length, r.requiredInvigilators ?? 0)
        }
        assigned += r.invigilators.length
      }
    const withoutRoom = this.rows.filter((r) => !r.rooms.length).length
    const overlapPersons = this.roster.filter((p) => p.overlaps).length
    return { open, required, staffed, unknown, assigned, withoutRoom, overlapPersons }
  })

  search = $state('')
  view = $state<'all' | 'open' | 'overlaps'>('all')
  needsWork = (row: Row) =>
    !row.rooms.length ||
    row.rooms.some((r) => openPositions(r) !== 0 || missingPartition(r.saved, row.rooms.length))
  hasOverlap = (row: Row) =>
    row.rooms.some((r) =>
      r.invigilators.some((p) => this.overlapping.has(dutyKey(row.id, r.room, p)))
    )
  visibleRows = $derived.by(() => {
    const terms = this.search.toLocaleLowerCase('de').split(/\s+/).filter(Boolean)
    return this.rows.filter((row) => {
      if (!row.dirty && this.view === 'open' && !this.needsWork(row)) return false
      if (!row.dirty && this.view === 'overlaps' && !this.hasOverlap(row)) return false
      if (!terms.length) return true
      const text = [
        row.entry.examName,
        examModuleAbbrevs(row.entry),
        ...row.rooms.flatMap((r) => [
          r.saved.abbrev,
          r.saved.label,
          ...r.invigilators.map(this.fullName)
        ])
      ]
        .join(' ')
        .toLocaleLowerCase('de')
      return terms.every((t) => text.includes(t))
    })
  })
  /** Visible appointments grouped by day. */
  days = $derived.by(() => {
    const days: { day: string; rows: Row[] }[] = []
    for (const row of this.visibleRows) {
      const day = fmtWeekdayLong(row.start)
      const last = days.at(-1)
      if (last?.day === day) last.rows.push(row)
      else days.push({ day, rows: [row] })
    }
    return days
  })

  /** Appointments selected for the automatic assignment, which fills all their rooms. */
  selection = new SvelteSet<string>()
  select = (row: Row, checked: boolean) =>
    checked ? this.selection.add(row.id) : this.selection.delete(row.id)
  selectedRows = $derived(this.rows.filter((row) => this.selection.has(row.id)))
  selectedOpen = $derived(
    this.selectedRows.reduce(
      (n, row) => n + row.rooms.reduce((m, r) => m + (openPositions(r) ?? 0), 0),
      0
    )
  )
  /** Visible appointments with open known demand. */
  openRows = $derived(this.visibleRows.filter((row) => row.rooms.some((r) => openPositions(r))))
  selectOpen = () => this.openRows.forEach((row) => this.selection.add(row.id))

  edit = (row: Row, room: string, change: Partial<Staffing>) => {
    if (this.assigning) return
    const current = row.rooms.find((r) => r.room === room)
    if (!current) return
    const { requiredInvigilators, invigilators } = current
    this.drafts[row.id] = {
      ...this.drafts[row.id],
      [room]: { requiredInvigilators, invigilators, ...change }
    }
  }

  saving = new SvelteSet<string>()
  saved = new SvelteSet<string>()
  rowErrors = new SvelteMap<string, string>()

  discard = (id: string) => {
    if (this.saving.has(id) || this.assigning) return
    delete this.drafts[id]
    this.rowErrors.delete(id)
  }

  /** Saves the staffing of one appointment, keeping seats and partitions of its saved rooms. */
  save = async (row: Row) => {
    if (this.saving.has(row.id) || this.assigning) return
    const invalid = row.rooms.map((r) => staffingError(r, r.saved.abbrev)).find(Boolean)
    if (invalid) {
      this.rowErrors.set(row.id, invalid)
      return
    }
    this.saving.add(row.id)
    this.rowErrors.delete(row.id)
    const { draftId } = this
    const submitted = $state.snapshot(this.drafts[row.id] ?? {})
    const rooms = row.rooms.map((r) => ({
      room: r.room,
      allocatedSeats: r.saved.allocatedSeats,
      requiredInvigilators: r.requiredInvigilators,
      partitionBy: r.saved.partitionBy,
      partitionValue: r.saved.partitionValue,
      invigilators: [...r.invigilators]
    }))
    try {
      putEntry(draftId, row.id, await updateExamRooms({ draftId, id: row.id, rooms }))
      const current = this.drafts[row.id]
      if (current) {
        for (const [room, staffing] of Object.entries(submitted))
          if (same(current[room], staffing)) delete current[room]
        if (!Object.keys(current).length) delete this.drafts[row.id]
      }
      this.saved.add(row.id)
      setTimeout(() => this.saved.delete(row.id), 2000)
    } catch (error) {
      this.rowErrors.set(row.id, getErrorMessage(error))
    } finally {
      this.saving.delete(row.id)
    }
  }

  assigning = $state(false)
  assigned = $state(false)
  actionError = $state<string>()

  /** Fills the open known demand of the selected appointments and keeps only those still open selected. */
  assign = async () => {
    if (this.assigning || !this.selectedOpen) return
    if (this.saving.size) {
      this.actionError = 'Bitte warten, bis die laufenden Speichervorgänge abgeschlossen sind.'
      return
    }
    if (this.dirtyCount) {
      this.pending = { kind: 'assign' }
      return
    }
    this.assigning = true
    this.actionError = undefined
    const selected = this.selectedRows.flatMap((row) =>
      row.rooms.map((r) => ({ entry: row.id, room: r.room }))
    )
    const before = this.status.assigned
    try {
      const next = await assignInvigilators({ draftId: this.draftId, rooms: selected })
      let after = 0
      for (const e of next) {
        after += e.rooms.reduce((n, r) => n + r.invigilators.length, 0)
        if (!e.rooms.some((r) => openPositions(savedStaffing(r)))) this.selection.delete(e.id)
      }
      if (after > before) {
        this.assigned = true
        setTimeout(() => (this.assigned = false), 2000)
      } else
        this.actionError = this.activeCandidates.length
          ? 'Zu diesen Zeiten ist keine ausgewählte aktive Person frei.'
          : 'In den Einstellungen ist keine aktive Aufsichtsperson ausgewählt.'
    } catch (error) {
      this.actionError = getErrorMessage(error)
    } finally {
      this.assigning = false
    }
  }

  /** Action waiting for unsaved changes to be discarded. */
  pending = $state<{ kind: 'assign' } | { kind: 'leave'; url: URL }>()

  discardAndContinue = () => {
    if (this.saving.size || this.assigning) return
    const action = this.pending
    this.pending = undefined
    this.drafts = {}
    this.rowErrors.clear()
    if (action?.kind === 'leave') goto(action.url)
    else if (action) this.assign()
  }

  /** Badge class and label of a room: open, complete, too many or unknown demand. */
  roomState = (r: Staffing): [string, string] => {
    const n = r.requiredInvigilators
    if (n === null || !isCount(n)) return ['text-muted-foreground', 'Bedarf unbekannt']
    if (r.invigilators.length > n)
      return [stateBadge.destructive, `${r.invigilators.length - n} zu viel`]
    const open = n - r.invigilators.length
    return open ? [stateBadge.warning, `${open} offen`] : [stateBadge.ok, 'Vollständig']
  }

  /** Persons of the room overlapping another of their duties. */
  clashes = (row: Row, r: Row['rooms'][number]) =>
    r.invigilators.filter((p) => this.overlapping.has(dutyKey(row.id, r.room, p)))

  /** Load of a person as `2 Aufsichten, 3 h`. */
  load = (id: string) =>
    `${plural(this.dutyCount(id), 'Aufsicht', 'Aufsichten')}, ${fmtHours(this.dutyMs(id))} h`

  /** Active persons least loaded first, for manual staffing beyond the automatic selection. */
  #activeByLoad = $derived(
    this.labels.persons
      .filter((p) => p.isActive)
      .map((p) => p.id)
      .toSorted(
        (a, b) =>
          this.dutyMs(a) - this.dutyMs(b) ||
          this.dutyCount(a) - this.dutyCount(b) ||
          this.fullName(a).localeCompare(this.fullName(b), 'de')
      )
  )

  /** Active persons least loaded first, preceded by assigned ones that are inactive or missing. */
  personOptions = (row: Row, room: string, selected: string[]) => {
    const option = (id: string, extra?: string) => ({
      id,
      label: this.fullName(id),
      hint: [extra, this.load(id), this.busyAt(id, row, room) ? 'zeitgleich eingeteilt' : undefined]
        .filter(Boolean)
        .join(', ')
    })
    return [
      ...selected
        .filter((id) => !this.personById.get(id)?.isActive)
        .map((id) => option(id, 'Nicht aktiv')),
      ...this.#activeByLoad.map((id) => option(id))
    ]
  }
}

export type Row = Invigilation['rows'][number]
