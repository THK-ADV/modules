<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import {
    Calendar,
    toExamEvent,
    type CalendarEvent,
    type CalendarEventProps,
    type DateSelectInfo,
    type EventClickInfo,
    type EventDropInfo,
    type HolidayEventProps,
    type SemesterPlanEventProps
  } from '$lib/calendar'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Resizable from '$lib/components/ui/resizable/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import type { ExamEntryDraft, ExamOffer } from '$lib/schemas/exam-planning'
  import { getErrorMessage } from '$lib/errors'
  import { fmtDateTime } from '$lib/formats'
  import { uiStore } from '$lib/stores/ui.svelte.js'
  import { cn } from '$lib/utils'
  import {
    CalendarClock,
    CircleCheck,
    Check,
    CloudUpload,
    LoaderCircle,
    Upload,
    UserRoundCheck
  } from '@lucide/svelte'
  import { untrack, type Snippet } from 'svelte'
  import { MediaQuery } from 'svelte/reactivity'
  import {
    getExamEntries,
    getExamPlan,
    getExamPlanningLabels,
    getExamPool,
    getExamPoolConfig,
    createExamEntry,
    publishExamPlan,
    saveExamPoolConfig,
    updateExamEntry
  } from '../exam-planning.remote'
  import ExamEntryPanel, { type ExamTarget, type PanelMode } from './exam-entry-panel.svelte'
  import {
    berlinInstant,
    labelMaps,
    offerKey,
    openPositions,
    plural,
    preselectMethod,
    putEntry
  } from './exam-planning'
  import ExamPoolSettings from './exam-pool-settings.svelte'
  import ExamPool from './exam-pool.svelte'
  import RefreshButton from './refresh-button.svelte'

  let {
    draftId: planId,
    holidays,
    semesterEntries,
    canEdit,
    header
  }: {
    draftId: string
    holidays: {
      timeGrid: CalendarEvent<HolidayEventProps>[]
      monthBg: CalendarEvent<HolidayEventProps>[]
    }
    semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
    canEdit: boolean
    header: Snippet
  } = $props()

  /**
   * The plan of this instance, which the page remounts for another plan. Read once, since the prop reads the page's
   * current plan, so responses arriving after a switch still update the plan they were sent for.
   */
  const draftId = untrack(() => planId)

  const [plan, config, labels, entries] = $derived(
    await Promise.all([
      getExamPlan(draftId),
      getExamPoolConfig(draftId),
      getExamPlanningLabels(),
      getExamEntries(draftId)
    ])
  )
  const poolSelection = $derived({
    semester: config.semester,
    phases: config.phases,
    assessmentMethods: config.assessmentMethods
  })
  /** Published offers of the selection that have no appointment yet. */
  const pool = $derived(await getExamPool(poolSelection))
  const maps = $derived(labelMaps(labels))
  /** Invigilations per person over all appointments of the plan, one per appointment and room. */
  const duties = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to the derivation
    const counts = new Map<string, number>()
    for (const e of entries)
      for (const r of e.rooms)
        for (const { id } of r.invigilators) counts.set(id, (counts.get(id) ?? 0) + 1)
    return counts
  })

  const events = $derived([
    ...(uiStore.selectedCalendarView === 'dayGridMonth' ? holidays.monthBg : holidays.timeGrid),
    ...semesterEntries,
    ...entries.map((e) => toExamEvent(e, maps.methods))
  ])

  /** First appointment, else the exam period of the semester plan, else the semester start. */
  const initialDate = untrack(
    () =>
      entries[0]?.start ??
      semesterEntries.find(
        (e) =>
          e.extendedProps.type === 'exam' &&
          String(e.start) >= plan.semester.start &&
          String(e.start) <= plan.semester.end
      )?.start ??
      plan.semester.start
  )

  let calendar = $state<ReturnType<typeof Calendar>>()
  let errorMessage = $state<string>()
  const desktop = new MediaQuery('(min-width: 64rem)')
  /** Width of the editor, to keep the side panel at least 22rem wide. */
  let width = $state(0)
  const SIDE_SIZE_KEY = 'exam-plan-side-size'
  /** Share of the side panel in percent, as last resized by the user. */
  const sideSize = (() => {
    try {
      return Number(localStorage.getItem(SIDE_SIZE_KEY)) || 40
    } catch {
      return 40
    }
  })()
  let latestSideSize = sideSize
  /** Stores the width once a resize ends rather than on every move. */
  function storeSideSize() {
    try {
      localStorage.setItem(SIDE_SIZE_KEY, String(latestSideSize))
    } catch {
      // Keeps the default width without storage.
    }
  }

  let mode = $state<PanelMode | null>(null)
  /** Remounts the panel for another appointment or a new one, so its drafts start fresh. */
  let panelKey = $state(0)
  let dirty = $state(false)
  let pendingMode = $state<PanelMode | null | undefined>(undefined)
  /** Page to leave for once the unsaved changes are discarded. */
  let pendingUrl = $state<URL>()

  beforeNavigate((navigation) => {
    if (!dirty) return
    navigation.cancel()
    if (navigation.type !== 'leave' && navigation.to) pendingUrl = navigation.to.url
  })

  const editedId = $derived(mode?.kind === 'edit' ? mode.entry.id : null)
  /**
   * The current state of the opened appointment, e.g. after moving it in the calendar, read from the cached
   * appointments, which already hold a just created one while the rendered ones follow; `null` once it is deleted.
   */
  const panelEntry = $derived(
    editedId
      ? ((getExamEntries(draftId).current ?? entries).find((e) => e.id === editedId) ?? null)
      : null
  )
  const panelMode = $derived<PanelMode | null>(
    mode?.kind === 'edit' ? (panelEntry ? { kind: 'edit', entry: panelEntry } : null) : mode
  )

  // An appointment deleted elsewhere, e.g. found on refreshing, closes its panel along with its unsaved edits.
  $effect(() => {
    if (!editedId || panelEntry) return
    untrack(() => {
      errorMessage = `Der geöffnete Termin wurde inzwischen gelöscht${dirty ? ', nicht gespeicherte Änderungen daran sind verworfen' : ''}.`
      dirty = false
      openPanel(null)
    })
  })

  /** Opens another panel, asking first if the current one has unsaved changes. */
  function openPanel(next: PanelMode | null) {
    if (next?.kind === 'edit' && next.entry.id === editedId) return
    if (dirty) {
      pendingMode = next
      return
    }
    mode = next
    panelKey++
  }

  function discardAndOpen() {
    dirty = false
    if (pendingUrl) {
      const url = pendingUrl
      pendingUrl = undefined
      return goto(url)
    }
    const next = pendingMode ?? null
    pendingMode = undefined
    openPanel(next)
  }

  /** A new or deleted appointment takes its offer out of the pool or puts it back. */
  function refreshPool() {
    getExamPool(poolSelection)
      .refresh()
      .catch((error) => (errorMessage = getErrorMessage(error)))
  }

  function onSaved(entry: ExamEntryDraft, created: boolean) {
    if (putEntry(draftId, entry.id, entry)) refreshPool()
    if (created) {
      calendar?.gotoDate(entry.start)
      // The creating panel stays mounted and takes over the appointment with its edits made meanwhile.
      mode = { kind: 'edit', entry }
    }
  }

  function onDeleted(id: string) {
    putEntry(draftId, id)
    refreshPool()
    dirty = false
    openPanel(null)
  }

  function create(target: ExamTarget | null, slot?: { start: Date; end: Date }) {
    openPanel({ kind: 'create', target, slot })
  }

  /** Draft of a calendar event, whose `raw` is typed as a published appointment. */
  const draftOf = (props: CalendarEventProps) =>
    props.source === 'exam' ? entries.find((e) => e.id === props.raw.id) : undefined

  function onEventClick(info: EventClickInfo) {
    const entry = draftOf(info.event.extendedProps)
    if (entry) openPanel({ kind: 'edit', entry })
  }

  /** Fills an open creation form with the slot, otherwise starts a new appointment there. */
  function onDateSelect({ start, end }: DateSelectInfo) {
    if (mode?.kind === 'create') mode = { ...mode, slot: { start, end } }
    else create(null, { start, end })
  }

  /**
   * Places a pool offer dragged into the calendar: it starts at the drop, at 09:00 on an all-day drop, and lasts one
   * hour. With an unambiguous assessment method the appointment is created right away and the pool stays open for the
   * next one, otherwise the creation form opens with the slot.
   */
  async function onOfferDrop(info: {
    date: Date
    dateStr: string
    allDay: boolean
    draggedEl: HTMLElement
  }) {
    const offer = pool.find((o) => offerKey(o) === info.draggedEl.dataset.offerKey)
    if (!offer) return
    const start = info.allDay ? new Date(berlinInstant(info.dateStr, '09:00')) : info.date
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const assessmentMethod = preselectMethod(offer.assessmentMethods, config.assessmentMethods)
    if (!assessmentMethod) return create(offer, { start, end })
    try {
      const created = await createExamEntry({
        draftId,
        entry: {
          exam: offer.exam,
          phase: offer.phase,
          start: start.toISOString(),
          end: end.toISOString(),
          expectedParticipants: null,
          assessmentMethod
        }
      })
      onSaved(created, false)
    } catch (error) {
      errorMessage = getErrorMessage(error)
    }
  }

  /** Moves or resizes an appointment, keeping its rooms and expected participants. */
  async function onMove(info: EventDropInfo) {
    const entry = draftOf(info.extendedProps)
    if (!entry || !info.newStart || !info.newEnd) return info.revert()
    try {
      const updated = await updateExamEntry({
        draftId,
        id: entry.id,
        times: {
          start: info.newStart.toISOString(),
          end: info.newEnd.toISOString(),
          expectedParticipants: entry.expectedParticipants,
          assessmentMethod: entry.assessmentMethod
        }
      })
      onSaved(updated, false)
    } catch (error) {
      info.revert()
      errorMessage = getErrorMessage(error)
    }
  }

  /**
   * Reloads plan, settings, appointments and pool; an opened appointment keeps its unsaved edits unless it was
   * deleted.
   */
  const refresh = () =>
    Promise.all([
      getExamPlan(draftId).refresh(),
      getExamPoolConfig(draftId).refresh(),
      getExamEntries(draftId).refresh(),
      getExamPool(poolSelection).refresh()
    ])

  let publishOpen = $state(false)
  let publishing = $state(false)
  let published = $state(false)

  async function publish() {
    if (publishing) return
    publishing = true
    publishOpen = false
    try {
      await publishExamPlan(draftId)
      published = true
      setTimeout(() => (published = false), 2000)
    } catch (error) {
      errorMessage = getErrorMessage(error)
    } finally {
      publishing = false
    }
  }

  const withoutRoom = $derived(entries.filter((e) => !e.rooms.length).length)
  const openInvigilations = $derived(
    entries.reduce(
      (sum, e) =>
        e.rooms.reduce(
          (n, r) =>
            n +
            (openPositions({
              requiredInvigilators: r.requiredInvigilators,
              invigilators: r.invigilators.map((i) => i.id)
            }) ?? 0),
          sum
        ),
      0
    )
  )
</script>

{#snippet poolList()}
  <ExamPool
    offers={pool}
    {maps}
    studyPrograms={labels.studyPrograms}
    {canEdit}
    onCreate={(offer: ExamOffer) => create(offer)}
  />
{/snippet}

{#snippet panel(closable: boolean)}
  {#if panelMode}
    {#key panelKey}
      <ExamEntryPanel
        mode={panelMode}
        {draftId}
        {labels}
        {maps}
        {duties}
        preferredMethods={config.assessmentMethods}
        {canEdit}
        {closable}
        bind:dirty
        onClose={() => openPanel(null)}
        {onSaved}
        {onDeleted}
      />
    {/key}
  {/if}
{/snippet}

<div class="min-h-0 flex-1" bind:clientWidth={width}>
  <Resizable.PaneGroup
    direction="horizontal"
    onLayoutChange={(layout: number[]) => {
      latestSideSize = layout[1] ?? latestSideSize
    }}
    class="h-auto! overflow-visible!"
  >
    <Resizable.Pane
      id="exam-plan-main"
      order={1}
      defaultSize={100 - sideSize}
      class="min-w-0 space-y-6 overflow-visible!"
    >
      {@render header()}

      <ErrorMessage bind:message={errorMessage} />

      <section
        class="bg-muted/25 flex flex-col gap-4 rounded-xl border p-5 xl:flex-row xl:items-center xl:justify-between"
        aria-label="Stand des Prüfungsplans"
      >
        <div class="flex items-start gap-3" role="status" aria-live="polite">
          <div
            class="bg-background flex size-10 shrink-0 items-center justify-center rounded-lg border"
          >
            {#if plan.planDraft.publishedAt !== null && !plan.hasUnpublishedChanges}
              <CircleCheck
                class="size-5 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
            {:else if plan.planDraft.publishedAt !== null}
              <CloudUpload class="size-5 text-sky-700 dark:text-sky-400" aria-hidden="true" />
            {:else}
              <CalendarClock class="text-muted-foreground size-5" aria-hidden="true" />
            {/if}
          </div>
          <div class="min-w-0 space-y-1">
            <h2 class="text-lg font-semibold tracking-tight">
              {entries.length ? plural(entries.length, 'Termin', 'Termine') : 'Noch keine Termine'}
              {#if withoutRoom}
                <span class="text-muted-foreground text-base font-normal"
                  >· {withoutRoom} ohne Raum</span
                >
              {/if}
              {#if openInvigilations}
                <span class="text-muted-foreground text-base font-normal"
                  >· {plural(openInvigilations, 'Aufsicht', 'Aufsichten')} offen</span
                >
              {/if}
            </h2>
            <p class="text-muted-foreground text-sm">
              {#if plan.planDraft.publishedAt === null}
                Noch nicht veröffentlicht
              {:else}
                Zuletzt veröffentlicht am {fmtDateTime(plan.planDraft.publishedAt)}
              {/if}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <RefreshButton {refresh} onError={(message) => (errorMessage = message)} />
          <Button
            variant="outline"
            href={resolve('/planning/exam/[draftId]/invigilation', { draftId })}
          >
            <UserRoundCheck aria-hidden="true" />
            {canEdit ? 'Aufsichten einteilen' : 'Aufsichten'}
          </Button>
          {#if canEdit}
            <ExamPoolSettings
              {config}
              phases={labels.examPhases}
              methods={labels.assessmentMethods}
              persons={labels.persons}
              {duties}
              save={(next) => saveExamPoolConfig({ draftId, config: next })}
            />
            <Button onclick={() => (publishOpen = true)}>
              {#if publishing}<LoaderCircle
                  class="animate-spin"
                  aria-hidden="true"
                />{:else if published}<Check aria-hidden="true" />{:else}<Upload
                  aria-hidden="true"
                />{/if}
              <span class="grid justify-items-start" aria-live="polite">
                <span class={cn('col-start-1 row-start-1', published && 'invisible')}
                  >Veröffentlichen</span
                >
                <span class={cn('col-start-1 row-start-1', !published && 'invisible')}
                  >Veröffentlicht</span
                >
              </span>
            </Button>
          {/if}
        </div>
      </section>

      {#if !desktop.current}
        <div class="flex max-h-[28rem] flex-col overflow-hidden rounded-xl border">
          {@render poolList()}
        </div>
      {/if}

      <div class="min-h-[60vh]">
        <Calendar
          bind:this={calendar}
          {events}
          {initialDate}
          editableSource="exam"
          {onEventClick}
          onDateSelect={canEdit ? onDateSelect : undefined}
          onEventDrop={canEdit ? onMove : undefined}
          onEventResize={canEdit ? onMove : undefined}
          onExternalDrop={canEdit ? onOfferDrop : undefined}
        />
      </div>
    </Resizable.Pane>

    {#if desktop.current}
      <!-- An invisible 12px strip over the panel's left border, which it highlights via --edge. -->
      <Resizable.Handle
        aria-label="Breite des Seitenbereichs ändern"
        onDraggingChange={(dragging: boolean) => !dragging && storeSideSize()}
        onkeyup={storeSideSize}
        class="peer z-10 -mr-1.5 ml-4.5 w-3 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Resizable.Pane
        id="exam-plan-side"
        order={2}
        defaultSize={sideSize}
        minSize={width ? Math.min(60, (100 * 352) / width) : 25}
        maxSize={60}
        class="overflow-visible! peer-hover:[--edge:var(--color-muted-foreground)] peer-data-active:[--edge:var(--color-muted-foreground)]"
      >
        <aside
          aria-label={panelMode ? 'Prüfungstermin' : 'Prüfungen'}
          class="bg-background sticky top-6 flex h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-xl border border-l-[var(--edge,var(--color-border))] shadow-[inset_1px_0_0_var(--edge,transparent)] transition-[border-color,box-shadow]"
        >
          {#if panelMode}
            {@render panel(true)}
          {:else}
            {@render poolList()}
          {/if}
        </aside>
      </Resizable.Pane>
    {/if}
  </Resizable.PaneGroup>
</div>

{#if !desktop.current}
  <Sheet.Root open={panelMode !== null} onOpenChange={(open) => !open && openPanel(null)}>
    <Sheet.Content side="right" class="flex w-full flex-col gap-0 p-0 sm:max-w-none">
      <Sheet.Title class="sr-only">Prüfungstermin</Sheet.Title>
      <Sheet.Description class="sr-only">Termin, Räume und Aufsicht der Prüfung</Sheet.Description>
      {@render panel(false)}
    </Sheet.Content>
  </Sheet.Root>
{/if}

<Dialog.Root
  open={pendingMode !== undefined || pendingUrl !== undefined}
  onOpenChange={(open) => {
    if (open) return
    pendingMode = undefined
    pendingUrl = undefined
  }}
>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Änderungen verwerfen</Dialog.Title>
      <Dialog.Description>
        Der geöffnete Termin hat nicht gespeicherte Änderungen an Termin oder Räumen.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="gap-2">
      <Button
        variant="outline"
        onclick={() => {
          pendingMode = undefined
          pendingUrl = undefined
        }}>Weiter bearbeiten</Button
      >
      <Button variant="destructive" onclick={discardAndOpen}>Verwerfen</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={publishOpen}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Prüfungsplan veröffentlichen</Dialog.Title>
      <Dialog.Description>
        {#if entries.length}
          {plural(entries.length, 'Termin erscheint', 'Termine erscheinen')} im Semesterkalender, auch
          solche ohne Raum oder Aufsicht.
        {:else}
          Der Plan enthält keine Termine; bisher veröffentlichte Termine werden aus dem
          Semesterkalender entfernt.
        {/if}
        Der Plan bleibt bearbeitbar, spätere Änderungen erscheinen erst nach erneutem Veröffentlichen.
        {#if dirty}Nicht gespeicherte Änderungen im geöffneten Termin werden nicht veröffentlicht.{/if}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (publishOpen = false)}>Abbrechen</Button>
      <Button onclick={publish}><Upload aria-hidden="true" /> Veröffentlichen</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
