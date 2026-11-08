<script lang="ts" module>
  import type { ExamEntryDraft, ExamOffer } from '$lib/schemas/exam-planning'

  /** Exam and phase a new appointment is prefilled with, e.g. from an offer or another appointment. */
  export type ExamTarget = Pick<
    ExamOffer,
    'exam' | 'examName' | 'phase' | 'modules' | 'assessmentMethods'
  >

  export type PanelMode =
    | { kind: 'create'; target: ExamTarget | null; slot?: { start: Date; end: Date } }
    | { kind: 'edit'; entry: ExamEntryDraft }
</script>

<script lang="ts">
  import ExamEntryFacts, { examSubtitle } from '$lib/components/schedule/exam-entry-facts.svelte'
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Collapsible from '$lib/components/ui/collapsible/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { getErrorMessage } from '$lib/errors'
  import { fmtTime, fmtWeekdayDate } from '$lib/formats'
  import { examMethodLabels, examRoomLabel } from '$lib/types/exam-planning'
  import { cn } from '$lib/utils'
  import { parseDate } from '@internationalized/date'
  import {
    Armchair,
    Calendar1,
    CalendarDays,
    CalendarPlus,
    Check,
    ChevronUp,
    Clock,
    LoaderCircle,
    Save,
    Split,
    Trash2,
    TriangleAlert,
    UsersRound,
    X
  } from '@lucide/svelte'
  import { untrack } from 'svelte'
  import {
    createExamEntry,
    deleteExamEntry,
    updateExamEntry,
    updateExamRooms
  } from '../exam-planning.remote'
  import {
    berlinInstant,
    berlinParts,
    isCount,
    missingPartition,
    openPositions,
    partialPartition,
    plural,
    preselectMethod,
    staffingError,
    trimPartition,
    type LabelMaps,
    type PlanningLabels
  } from './exam-planning'
  import ExamPicker from './exam-picker.svelte'
  import InvigilatorPicker from './invigilator-picker.svelte'
  import OptionPicker from './option-picker.svelte'
  import TimePicker from './time-picker.svelte'

  let {
    mode,
    draftId,
    labels,
    maps,
    duties,
    preferredMethods,
    canEdit,
    closable = true,
    // eslint-disable-next-line no-useless-assignment -- required for Svelte bindable prop
    dirty = $bindable(false),
    onClose,
    onSaved,
    onDeleted
  }: {
    mode: PanelMode
    draftId: string
    labels: PlanningLabels
    maps: LabelMaps
    /** Saved invigilations per person over all appointments of the plan. */
    duties: Map<string, number>
    preferredMethods: string[]
    canEdit: boolean
    /** Shows an own close button; a sheet brings its own. */
    closable?: boolean
    /** Whether a section has unsaved changes. */
    dirty?: boolean
    onClose: () => void
    onSaved: (entry: ExamEntryDraft, created: boolean) => void
    onDeleted: (id: string) => void
  } = $props()

  interface Times {
    date: string
    start: string
    end: string
    expected: number | null
    assessmentMethod: string | null
  }
  interface Allocation {
    room: string
    allocatedSeats: number | null
    requiredInvigilators: number | null
    partitionBy: string | null
    partitionValue: string | null
    invigilators: string[]
  }

  const entry = $derived(mode.kind === 'edit' ? mode.entry : null)
  const initial = untrack(() => (mode.kind === 'create' ? mode.target : mode.entry))
  /** Exam of the appointment; a new one may be any exam, whose phase the planner chooses. */
  let target = $state<Omit<ExamTarget, 'phase'> | null>(
    untrack(() => (mode.kind === 'create' ? mode.target : null))
  )
  let phaseId = $state<string | null>(initial?.phase ?? null)

  function timesOf(e: ExamEntryDraft | null): Times {
    if (!e)
      return {
        date: '',
        start: '',
        end: '',
        expected: null,
        assessmentMethod: preselectMethod(
          mode.kind === 'create' ? (mode.target?.assessmentMethods ?? []) : [],
          preferredMethods
        )
      }
    const start = berlinParts(e.start)
    return {
      date: start.date,
      start: start.time,
      end: berlinParts(e.end).time,
      expected: e.expectedParticipants,
      assessmentMethod: e.assessmentMethod
    }
  }
  const roomsOf = (e: ExamEntryDraft | null): Allocation[] =>
    (e?.rooms ?? []).map((r) => ({
      room: r.id,
      allocatedSeats: r.allocatedSeats,
      requiredInvigilators: r.requiredInvigilators,
      partitionBy: r.partitionBy,
      partitionValue: r.partitionValue,
      invigilators: r.invigilators.map((i) => i.id)
    }))
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

  let timesBase = $state(untrack(() => timesOf(entry)))
  let times = $state(untrack(() => timesOf(entry)))
  let roomsBase = $state(untrack(() => roomsOf(entry)))
  let rooms = $state(untrack(() => roomsOf(entry)))

  const methodOptions = $derived.by(() => {
    const available = entry
      ? entry.modules.flatMap((m) => m.assessmentMethods)
      : (target?.assessmentMethods ?? [])
    const ids = [
      ...new Set([
        ...(available.length ? available : labels.assessmentMethods.map((m) => m.id)),
        ...(times.assessmentMethod ? [times.assessmentMethod] : [])
      ])
    ]
    return ids
      .map((id) => ({ id, label: maps.methods.get(id) ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label, 'de'))
  })

  // Takes over saved or moved values unless the section has unsaved edits.
  $effect.pre(() => {
    const nextTimes = timesOf(entry)
    const nextRooms = roomsOf(entry)
    untrack(() => {
      if (same(times, timesBase)) times = nextTimes
      timesBase = nextTimes
      if (same(rooms, roomsBase)) rooms = nextRooms
      roomsBase = nextRooms
    })
  })

  // A slot selected in the calendar fills the date and times of a new appointment.
  $effect.pre(() => {
    const slot = mode.kind === 'create' ? mode.slot : undefined
    if (!slot) return
    const start = berlinParts(slot.start)
    untrack(() => {
      times = { ...times, date: start.date, start: start.time, end: berlinParts(slot.end).time }
    })
  })

  const timesDirty = $derived(!same(times, timesBase))
  const roomsDirty = $derived(!same(rooms, roomsBase))
  const selectionDirty = $derived(
    !entry && (target?.exam !== initial?.exam || phaseId !== (initial?.phase ?? null))
  )
  $effect(() => {
    dirty = timesDirty || roomsDirty || selectionDirty
  })

  type Action = 'times' | 'rooms' | 'delete'
  let busy = $state<Action>()
  let done = $state<Action>()
  let timesError = $state<string>()
  let roomsError = $state<string>()
  let confirmDelete = $state(false)
  let dateOpen = $state(false)

  async function run(action: Action, setError: (m?: string) => void, task: () => Promise<void>) {
    if (busy) return
    busy = action
    setError(undefined)
    try {
      await task()
      done = action
      setTimeout(() => done === action && (done = undefined), 2000)
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      busy = undefined
    }
  }

  /** Validated times as instants in Germany, or the reason they are invalid. */
  function parseTimes() {
    if (!times.assessmentMethod) return 'Eine Prüfungsform auswählen.'
    if (!times.date || !times.start || !times.end) return 'Datum, Beginn und Ende angeben.'
    if (!isCount(times.expected)) return 'Erwartete Teilnehmende als ganze Zahl ab 0 angeben.'
    const start = berlinInstant(times.date, times.start)
    const end = berlinInstant(times.date, times.end)
    if (Date.parse(end) <= Date.parse(start)) return 'Das Ende muss nach dem Beginn liegen.'
    return {
      start,
      end,
      expectedParticipants: times.expected,
      assessmentMethod: times.assessmentMethod
    }
  }

  function saveTimes() {
    const parsed = parseTimes()
    if (typeof parsed === 'string') return (timesError = parsed)
    if (!entry && !target) return (timesError = 'Eine Prüfung auswählen.')
    if (!entry && !maps.phases.has(phaseId ?? ''))
      return (timesError = 'Eine Prüfungsphase auswählen.')
    const setError = (m?: string) => (timesError = m)
    return run('times', setError, async () => {
      const submitted = $state.snapshot(times)
      let saved: ExamEntryDraft
      if (entry) saved = await updateExamEntry({ draftId, id: entry.id, times: parsed })
      else if (target && phaseId)
        saved = await createExamEntry({
          draftId,
          entry: { exam: target.exam, phase: phaseId, ...parsed }
        })
      else return
      // The sent values count as saved; edits made while saving stay unsaved.
      if (same(times, submitted)) times = timesOf(saved)
      onSaved(saved, !entry)
    })
  }

  function saveRooms() {
    if (!entry) return
    if (rooms.some((r) => !isCount(r.allocatedSeats)))
      return (roomsError = 'Belegte Plätze als ganze Zahl ab 0 angeben.')
    const invalid = rooms
      .map((r) => staffingError(r, roomOf(r.room)?.abbrev ?? 'Unbekannter Raum'))
      .find(Boolean)
    if (invalid) return (roomsError = invalid)
    const partial = rooms.find(partialPartition)
    if (partial)
      return (roomsError = `${roomOf(partial.room)?.abbrev ?? 'Unbekannter Raum'}: Aufteilung nach und Bereich gemeinsam angeben oder beide leer lassen.`)
    const id = entry.id
    const submitted = $state.snapshot(rooms)
    const payload = submitted.map((r) => ({ ...r, ...trimPartition(r) }))
    return run(
      'rooms',
      (m) => (roomsError = m),
      async () => {
        const updated = await updateExamRooms({ draftId, id, rooms: payload })
        // Rooms left as sent take the saved values, e.g. trimmed partitions; edits made while saving stay unsaved.
        const saved = roomsOf(updated)
        rooms = rooms.map((r) => {
          const sent = submitted.find((s) => s.room === r.room)
          return (sent && same(r, sent) && saved.find((s) => s.room === r.room)) || r
        })
        onSaved(updated, false)
      }
    )
  }

  function remove() {
    if (!entry) return
    const id = entry.id
    return run(
      'delete',
      (m) => (timesError = m),
      async () => {
        await deleteExamEntry({ draftId, id })
        confirmDelete = false
        onDeleted(id)
      }
    )
  }

  /** Room data from the core data, falling back to the copy in the appointment. */
  function roomOf(id: string) {
    return maps.rooms.get(id) ?? entry?.rooms.find((r) => r.id === id)
  }

  /** Optimal and maximal exam seats of a room, unknown ones named as such. */
  function examSeats(room?: { examCapacityOpt: number | null; examCapacityMax: number | null }) {
    if (!room || (room.examCapacityOpt === null && room.examCapacityMax === null))
      return 'Prüfungsplätze unbekannt'
    const { examCapacityOpt: opt, examCapacityMax: max } = room
    return `Prüfungsplätze: ${opt ?? 'unbekannt'} optimal, ${max ?? 'unbekannt'} maximal`
  }

  /**
   * Exceeded exam capacity of a room: the known maximum, else the known optimum. `null` if the seats
   * stay within both or are unknown; an unknown capacity is never checked.
   */
  function overbooking({ room: id, allocatedSeats: seats }: Allocation) {
    const room = roomOf(id)
    if (seats === null || !room) return null
    const { abbrev: name, examCapacityOpt: opt, examCapacityMax: max } = room
    if (max !== null && seats > max) return { name, seats, limit: max, max: true }
    if (opt !== null && seats > opt) return { name, seats, limit: opt, max: false }
    return null
  }

  /** Hint below the allocated seats, distinguishing seats above the optimum from those above the maximum. */
  function seatsHint(allocation: Allocation) {
    const over = overbooking(allocation)
    if (!over) return ''
    return `${over.seats - over.limit} über ${over.max ? 'maximaler' : 'optimaler'} Kapazität (${over.limit})`
  }

  function addRoom(id: string) {
    rooms.push({
      room: id,
      allocatedSeats: roomOf(id)?.examCapacityOpt ?? null,
      requiredInvigilators: null,
      partitionBy: null,
      partitionValue: null,
      invigilators: []
    })
  }

  /** Full names of persons, including invigilators missing in the core data. */
  const personNames = $derived(
    new Map([
      ...(entry?.rooms.flatMap((r) => r.invigilators.map((i) => [i.id, i.label] as const)) ?? []),
      ...labels.persons.map((p) => [p.id, `${p.lastname}, ${p.firstname}`] as const)
    ])
  )
  const nameOf = (id: string) => personNames.get(id) ?? id

  /** Invigilations per person in the plan, with this appointment's saved rooms replaced by the edited ones. */
  const workload = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to the derivation
    const counts = new Map(duties)
    const add = (id: string, step: number) => counts.set(id, (counts.get(id) ?? 0) + step)
    entry?.rooms.forEach((r) => r.invigilators.forEach((i) => add(i.id, -1)))
    rooms.forEach((r) => r.invigilators.forEach((id) => add(id, 1)))
    return counts
  })
  const dutiesHint = (id: string) =>
    plural(workload.get(id) ?? 0, 'Aufsicht im Plan', 'Aufsichten im Plan')

  const activePersons = $derived(
    labels.persons
      .filter((p) => p.isActive)
      .map((p) => ({
        id: p.id,
        label: `${p.lastname}, ${p.firstname}`,
        hint: dutiesHint(p.id),
        keywords: [p.abbreviation]
      }))
  )
  /** Active persons, preceded by selected ones that are inactive or missing in the core data. */
  function personOptions(selected: string[]) {
    const missing = selected
      .filter((id) => !activePersons.some((p) => p.id === id))
      .map((id) => ({ id, label: nameOf(id), hint: `Nicht aktiv, ${dutiesHint(id)}` }))
    return [...missing, ...activePersons]
  }

  const roomOptions = $derived(
    labels.rooms
      .filter((r) => !rooms.some((a) => a.room === r.id))
      .map((r) => {
        const from = r.examCapacityOpt ?? r.examCapacityMax
        const to = r.examCapacityMax ?? r.examCapacityOpt
        return {
          id: r.id,
          label: r.label ? `${r.abbrev} – ${r.label}` : r.abbrev,
          hint: examSeats(r),
          range: from === null || to === null ? undefined : ([from, to] as [number, number])
        }
      })
  )

  const seats = $derived(
    rooms.reduce(
      (acc, r) =>
        r.allocatedSeats === null
          ? { ...acc, unknown: acc.unknown + 1 }
          : { ...acc, sum: acc.sum + r.allocatedSeats },
      { sum: 0, unknown: 0 }
    )
  )

  const overbooked = $derived(rooms.map(overbooking).filter((o) => o !== null))

  type Tone = 'muted' | 'warning' | 'error'
  /** Seats missing or unknown for the expected participants; nothing if they suffice or the demand is unknown. */
  const seatSummary = $derived.by((): [Tone, string] | null => {
    const expected = times.expected
    const known = expected === null ? null : isCount(expected) ? expected : null
    if (!rooms.length || known === null) return null
    if (seats.unknown)
      return [
        'warning',
        `${seats.sum} von ${known} Plätzen bekannt, ${plural(seats.unknown, 'Raum', 'Räume')} ohne Platzangabe`
      ]
    if (seats.sum < known)
      return ['error', `${known - seats.sum} Plätze fehlen (${seats.sum} von ${known})`]
    return null
  })
  /** Open positions over rooms of known demand, also naming the rooms whose demand is unknown. */
  const invigilationSummary = $derived.by((): [Tone, string] | null => {
    if (!rooms.length) return null
    const open = rooms.map(openPositions)
    const unknown = open.filter((o) => o === null).length
    const missing = open.reduce<number>((sum, o) => sum + (o ?? 0), 0)
    if (!missing) return null
    const unknownText = unknown ? `, Bedarf in ${plural(unknown, 'Raum', 'Räumen')} unbekannt` : ''
    return ['warning', `${plural(missing, 'Aufsicht fehlt', 'Aufsichten fehlen')}${unknownText}`]
  })

  const unpartitioned = $derived(rooms.filter((r) => missingPartition(r, rooms.length)).length)

  /** Seats, invigilations, partition and capacity of the rooms as one wrapping line. */
  const status = $derived(
    [
      { icon: Armchair, state: seatSummary },
      { icon: UsersRound, state: invigilationSummary },
      {
        icon: Split,
        state: unpartitioned
          ? ([
              'warning',
              `Aufteilung fehlt in ${unpartitioned} von ${rooms.length} Räumen`
            ] as const)
          : null
      },
      {
        icon: TriangleAlert,
        state: overbooked.length
          ? ([
              'warning',
              `${plural(overbooked.length, 'Raum', 'Räume')} über Prüfungskapazität`
            ] as const)
          : null,
        title: overbooked
          .map((o) => `${o.name}: ${o.seats} von ${o.max ? 'maximal' : 'optimal'} ${o.limit}`)
          .join('; ')
      }
    ].flatMap(({ state, ...rest }) => (state ? [{ ...rest, state }] : []))
  )

  /** Hint below the participant partition of a room. */
  function partitionHint(allocation: Allocation): [Tone, string] {
    const { partitionBy, partitionValue } = trimPartition(allocation)
    if (partialPartition(allocation))
      return ['error', 'Beide Felder angeben oder beide leer lassen.']
    if (partitionBy && partitionValue)
      return [
        'muted',
        `Für Teilnehmende: ${examRoomLabel({ abbrev: roomOf(allocation.room)?.abbrev ?? 'Raum', partitionValue })}`
      ]
    if (rooms.length > 1)
      return ['warning', 'Bei mehreren Räumen angeben, welche Teilnehmenden hier sitzen.']
    return ['muted', 'Optional, z. B. nach Nachname A-Me oder nach Gruppe Übung 1.']
  }

  /** Hint below the required invigilators of a room. */
  function requiredHint(allocation: Allocation) {
    const n = allocation.requiredInvigilators
    const assigned = allocation.invigilators.length
    if (n === null || !isCount(n)) return 'Ohne Angabe keine automatische Einteilung'
    if (assigned > n) return `${assigned - n} mehr eingeteilt als benötigt`
    return `${assigned} von ${n} eingeteilt`
  }

  const toneClass: Record<Tone, string> = {
    muted: 'text-muted-foreground',
    warning: 'text-amber-700 dark:text-amber-400',
    error: 'text-red-700 dark:text-red-400'
  }

  const phaseLabel = (id: string) => maps.phases.get(id) ?? id
</script>

{#snippet actionLabel(action: Action, label: string, doneLabel: string)}
  <span class="grid justify-items-start" aria-live="polite">
    <span class={cn('col-start-1 row-start-1', done === action && 'invisible')}>{label}</span>
    <span class={cn('col-start-1 row-start-1', done !== action && 'invisible')}>{doneLabel}</span>
  </span>
{/snippet}

{#snippet actionIcon(action: Action, Icon: typeof Save)}
  {#if busy === action}
    <LoaderCircle class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
  {:else if done === action}
    <Check class="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  {:else}
    <Icon aria-hidden="true" />
  {/if}
{/snippet}

{#snippet countInput(
  id: string,
  label: string,
  value: number | null,
  set: (v: number | null) => void,
  hint: string,
  warn = false,
  invalid = false
)}
  <!-- Side by side in a grid, the subgrid aligns labels, inputs and hints of both columns. -->
  <div class="row-span-3 grid grid-rows-subgrid gap-2">
    <Label for={id} class="self-end">{label}</Label>
    <Input
      {id}
      type="number"
      min="0"
      step="1"
      inputmode="numeric"
      placeholder="Unbekannt"
      class="h-9"
      aria-invalid={invalid || !isCount(value)}
      bind:value={() => value, set}
    />
    {#if hint}
      <p
        class={cn(
          'text-xs leading-snug',
          invalid
            ? 'text-red-700 dark:text-red-400'
            : warn
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-muted-foreground'
        )}
      >
        {hint}
      </p>
    {/if}
  </div>
{/snippet}

<div class="flex h-full min-h-0 flex-col">
  <div class="flex items-start justify-between gap-4 border-b py-4 pr-4 pl-6">
    <div class="min-w-0 space-y-1.5">
      <h2
        class="text-lg font-semibold tracking-tight wrap-anywhere outline-none"
        tabindex="-1"
        {@attach (node) => node.focus()}
      >
        {entry ? entry.examName : 'Neuer Termin'}
      </h2>
      {#if entry}
        <p class="text-muted-foreground text-sm">
          {examSubtitle(
            entry,
            examMethodLabels(times.assessmentMethod, maps.methods),
            labels.studyPrograms
          )}
        </p>
      {/if}
    </div>
    {#if closable}
      <Button variant="ghost" size="icon" class="size-9 shrink-0" onclick={onClose}>
        <X aria-hidden="true" />
        <span class="sr-only">Schließen</span>
      </Button>
    {/if}
  </div>

  <div class="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
    {#if !canEdit && entry}
      <div class="bg-muted/50 flex flex-wrap items-center gap-4 rounded-lg px-4 py-2.5 text-sm">
        <span class="flex items-center gap-2 font-medium">
          <CalendarDays class="text-muted-foreground size-4" aria-hidden="true" />
          {fmtWeekdayDate(entry.start)}
        </span>
        <span class="flex items-center gap-2 font-medium">
          <Clock class="text-muted-foreground size-4" aria-hidden="true" />
          {fmtTime(entry.start)} – {fmtTime(entry.end)}
        </span>
      </div>
      <ExamEntryFacts {entry} studyPrograms={labels.studyPrograms} />
    {:else}
      <section class="space-y-4" aria-labelledby={entry ? 'exam-entry-times' : undefined}>
        {#if entry}
          <div class="flex items-baseline justify-between gap-2">
            <h3 id="exam-entry-times" class="text-base font-semibold">Termin</h3>
            {#if timesDirty}
              <span class="text-xs text-amber-700 dark:text-amber-400">Nicht gespeichert</span>
            {/if}
          </div>
        {:else}
          <div class="grid gap-2">
            <Label for="exam-entry-exam">Prüfung</Label>
            <svelte:boundary>
              <ExamPicker
                id="exam-entry-exam"
                selected={target?.exam}
                label={target?.examName ?? 'Prüfung auswählen'}
                onSelect={(exam) => {
                  if (exam.id === target?.exam) return
                  target = {
                    exam: exam.id,
                    examName: exam.name,
                    modules: exam.modules,
                    assessmentMethods: exam.assessmentMethods
                  }
                  times.assessmentMethod = preselectMethod(exam.assessmentMethods, preferredMethods)
                  phaseId = null
                }}
              />
              {#snippet pending()}
                <OptionPicker
                  id="exam-entry-exam"
                  class="w-full"
                  options={[]}
                  onSelect={() => {}}
                  disabled
                  label={target?.examName ?? 'Prüfungen werden geladen …'}
                />
              {/snippet}
              {#snippet failed(error)}
                <p class="text-destructive text-sm" role="alert">{getErrorMessage(error)}</p>
              {/snippet}
            </svelte:boundary>
          </div>
          <div class="grid gap-2">
            <Label for="exam-entry-phase">Prüfungsphase</Label>
            <OptionPicker
              id="exam-entry-phase"
              class="w-full"
              options={labels.examPhases}
              selected={phaseId ? [phaseId] : []}
              onSelect={(id) => (phaseId = id)}
              label={phaseId ? phaseLabel(phaseId) : 'Prüfungsphase auswählen'}
            />
          </div>
        {/if}
        <div class="grid gap-2">
          <Label for="exam-entry-method">Prüfungsform</Label>
          <OptionPicker
            id="exam-entry-method"
            class="w-full"
            options={methodOptions}
            selected={times.assessmentMethod ? [times.assessmentMethod] : []}
            onSelect={(id) => (times.assessmentMethod = id)}
            label={times.assessmentMethod
              ? (maps.methods.get(times.assessmentMethod) ?? times.assessmentMethod)
              : 'Prüfungsform auswählen'}
          />
          {#if entry && !times.assessmentMethod}
            <p class="text-xs text-amber-700 dark:text-amber-400">
              Für diesen Termin wurde noch keine Prüfungsform festgelegt.
            </p>
          {/if}
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 grid gap-2">
            <Label for="exam-entry-date">Datum</Label>
            <Popover.Root bind:open={dateOpen}>
              <Popover.Trigger
                id="exam-entry-date"
                class={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-9 w-full justify-start font-normal',
                  !times.date && 'text-muted-foreground'
                )}
              >
                <Calendar1 class="size-4" aria-hidden="true" />
                {times.date ? fmtWeekdayDate(times.date) : 'Datum auswählen'}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0" align="start">
                <Calendar
                  type="single"
                  value={times.date ? parseDate(times.date) : undefined}
                  locale="de"
                  weekStartsOn={1}
                  onValueChange={(date) => {
                    if (!date) return
                    times.date = date.toString()
                    dateOpen = false
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </div>
          <div class="grid gap-2">
            <Label for="exam-entry-start">Beginn</Label>
            <TimePicker id="exam-entry-start" bind:value={times.start} />
          </div>
          <div class="grid gap-2">
            <Label for="exam-entry-end">Ende</Label>
            <TimePicker id="exam-entry-end" bind:value={times.end} />
          </div>
          <div class="col-span-2">
            {@render countInput(
              'exam-entry-expected',
              'Erwartete Teilnehmende',
              times.expected,
              (v) => (times.expected = v),
              'Leer lassen, solange die Zahl unbekannt ist.'
            )}
          </div>
        </div>
        {#if timesError}
          <p class="text-destructive text-sm" role="alert">{timesError}</p>
        {/if}
        <Button variant={entry ? 'outline' : 'default'} onclick={saveTimes}>
          {@render actionIcon('times', entry ? Save : CalendarPlus)}
          {@render actionLabel(
            'times',
            entry ? 'Termin speichern' : 'Termin anlegen',
            entry ? 'Gespeichert' : 'Angelegt'
          )}
        </Button>
      </section>

      {#if entry}
        <section class="space-y-4" aria-labelledby="exam-entry-rooms">
          <div class="flex items-baseline justify-between gap-2">
            <h3 id="exam-entry-rooms" class="text-base font-semibold">Räume und Aufsichten</h3>
            {#if roomsDirty}
              <span class="text-xs text-amber-700 dark:text-amber-400">Nicht gespeichert</span>
            {/if}
          </div>
          <!-- only warnings and errors; a complete allocation shows nothing -->
          {#if status.length}
            <ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm" role="status">
              {#each status as { icon: Icon, state, title } (Icon)}
                <li class={cn('flex items-start gap-1.5', toneClass[state[0]])} {title}>
                  <Icon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {state[1]}
                </li>
              {/each}
            </ul>
          {/if}

          <datalist id="exam-room-partition-presets">
            <option value="Nachname"></option>
          </datalist>
          {#if rooms.length}
            <!-- Cards fill the panel width and wrap into as many columns as it allows. -->
            <ul class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3">
              {#each rooms as allocation, index (allocation.room)}
                {@const room = roomOf(allocation.room)}
                {@const name = room?.abbrev ?? 'Unbekannter Raum'}
                {@const partitionState = partitionHint(allocation)}
                <li class="min-w-0 space-y-4 rounded-xl border p-4">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 space-y-1.5">
                      <p class="text-sm font-medium">
                        {name}
                        <span class="text-muted-foreground font-normal">{room?.label}</span>
                      </p>
                      <p class="text-muted-foreground text-xs leading-snug">
                        {examSeats(room)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-8 shrink-0 text-red-700 hover:text-red-800 dark:text-red-400"
                      aria-label="{name} entfernen"
                      onclick={() => rooms.splice(index, 1)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <div class="grid grid-cols-2 gap-x-3">
                    {@render countInput(
                      `exam-room-seats-${index}`,
                      'Belegte Plätze',
                      allocation.allocatedSeats,
                      (v) => (allocation.allocatedSeats = v),
                      seatsHint(allocation),
                      overbooking(allocation) !== null
                    )}
                    {@render countInput(
                      `exam-room-required-${index}`,
                      'Benötigte Aufsichten',
                      allocation.requiredInvigilators,
                      (v) => (allocation.requiredInvigilators = v),
                      requiredHint(allocation),
                      false,
                      allocation.requiredInvigilators !== null &&
                        allocation.invigilators.length > allocation.requiredInvigilators
                    )}
                  </div>
                  <!-- A single room seats everyone; values kept from more rooms stay visible. -->
                  {#if rooms.length > 1 || allocation.partitionBy || allocation.partitionValue}
                    <div class="grid grid-cols-2 gap-x-3 gap-y-2">
                      <Label for="exam-room-partition-by-{index}" class="self-end"
                        >Aufteilung nach</Label
                      >
                      <Label for="exam-room-partition-value-{index}" class="self-end"
                        >Teilnehmende</Label
                      >
                      <Input
                        id="exam-room-partition-by-{index}"
                        list="exam-room-partition-presets"
                        placeholder="z. B. Nachname"
                        class="h-9"
                        aria-invalid={partitionState[0] === 'error'}
                        aria-describedby="exam-room-partition-hint-{index}"
                        bind:value={
                          () => allocation.partitionBy ?? '',
                          (v) => (allocation.partitionBy = v || null)
                        }
                      />
                      <Input
                        id="exam-room-partition-value-{index}"
                        placeholder="z. B. A-Me"
                        class="h-9"
                        aria-invalid={partitionState[0] === 'error'}
                        aria-describedby="exam-room-partition-hint-{index}"
                        bind:value={
                          () => allocation.partitionValue ?? '',
                          (v) => (allocation.partitionValue = v || null)
                        }
                      />
                      <p
                        id="exam-room-partition-hint-{index}"
                        class={cn('col-span-2 text-xs leading-snug', toneClass[partitionState[0]])}
                      >
                        {partitionState[1]}
                      </p>
                    </div>
                  {/if}
                  <div class="grid gap-2">
                    <Label for="exam-room-invigilators-{index}">Aufsichtspersonen</Label>
                    <InvigilatorPicker
                      id="exam-room-invigilators-{index}"
                      label="Aufsichtspersonen in {name}"
                      options={personOptions(allocation.invigilators)}
                      value={allocation.invigilators}
                      onValueChange={(v) => (allocation.invigilators = v)}
                    />
                  </div>
                </li>
              {/each}
            </ul>
          {/if}

          <OptionPicker
            class="w-full"
            options={roomOptions}
            onSelect={addRoom}
            placeholder="z. B. 0208, >20 oder 20<x<30"
            label={labels.rooms.length ? 'Raum hinzufügen' : 'Keine Räume in den Stammdaten'}
            disabled={!roomOptions.length}
          />
          {#if roomsError}
            <p class="text-destructive text-sm" role="alert">{roomsError}</p>
          {/if}
          <Button variant="outline" onclick={saveRooms}>
            {@render actionIcon('rooms', Save)}
            {@render actionLabel('rooms', 'Räume speichern', 'Gespeichert')}
          </Button>
        </section>
      {/if}
    {/if}
  </div>

  {#if canEdit && entry}
    <!-- Docked above the footer; opening it shrinks the form above, so it unfolds upwards. -->
    <Collapsible.Root class="flex min-h-0 flex-col border-t">
      <Collapsible.Trigger
        class="hover:bg-muted/50 flex w-full items-center justify-between gap-2 px-6 py-3 text-sm font-semibold [&[data-state=open]>svg]:rotate-180"
      >
        Module und Studiengänge
        <ChevronUp class="text-muted-foreground size-4 transition-transform" aria-hidden="true" />
      </Collapsible.Trigger>
      <Collapsible.Content class="max-h-[45dvh] space-y-4 overflow-y-auto px-6 pt-1 pb-4">
        <ExamEntryFacts {entry} editing studyPrograms={labels.studyPrograms} />
      </Collapsible.Content>
    </Collapsible.Root>
    <div class="flex flex-wrap items-center gap-2 border-t px-6 py-4">
      <Button
        variant="ghost"
        size="sm"
        class="ml-auto text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        onclick={() => (confirmDelete = true)}
      >
        <Trash2 aria-hidden="true" />
        Termin löschen
      </Button>
    </div>
  {/if}
</div>

<Dialog.Root bind:open={confirmDelete}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Termin löschen</Dialog.Title>
      <Dialog.Description>
        Der Termin {entry ? `am ${fmtWeekdayDate(entry.start)}` : ''} wird mit seinen Räumen und Aufsichten
        aus dem Prüfungsplan gelöscht. Veröffentlicht wird die Löschung erst mit der nächsten Veröffentlichung.
      </Dialog.Description>
    </Dialog.Header>
    {#if timesError && confirmDelete}
      <p class="text-destructive text-sm" role="alert">{timesError}</p>
    {/if}
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (confirmDelete = false)}>Abbrechen</Button>
      <Button variant="destructive" onclick={remove}>
        {#if busy === 'delete'}<LoaderCircle
            class="animate-spin"
            aria-hidden="true"
          />{:else}<Trash2 aria-hidden="true" />{/if}
        Löschen
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
