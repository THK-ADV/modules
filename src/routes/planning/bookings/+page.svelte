<script lang="ts">
  import {
    isScheduleLike,
    type DateSelectInfo,
    type EventClickInfo,
    type EventCopyInfo,
    type EventDropInfo,
    type EventResizeInfo
  } from '$lib/calendar'
  import BookingKindPicker from '$lib/components/schedule/booking-kind-picker.svelte'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import BookingEditDialog, { type Mode } from '$lib/components/schedule/booking-edit-dialog.svelte'
  import {
    createBookings,
    deleteBooking,
    fetchBookingSeriesOccurrences,
    fetchBookings,
    updateBooking,
    updateBookingSeries
  } from '$lib/components/schedule/booking.remote'
  import ScheduleEntryDetailsDialog from '$lib/components/schedule/schedule-entry-details-dialog.svelte'
  import { liveScheduleEntryEditorApi } from '$lib/components/schedule/schedule-entry-editor-api'
  import ScheduleEntryUpdateScopeDialog from '$lib/components/schedule/schedule-entry-update-scope-dialog.svelte'
  import ScheduleFilter from '$lib/components/schedule/schedule-filter.svelte'
  import Schedule from '$lib/components/schedule/schedule.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { getErrorMessage } from '$lib/errors'
  import { schedulePlanningFilter } from '$lib/stores/schedule-filter.svelte'
  import {
    toBookingEdit,
    type BookingCreate,
    type BookingEdit,
    type BookingKind
  } from '$lib/types/booking'
  import type { ScheduleEntry, ScheduleEntryUpdateScope } from '$lib/types/schedule'
  import { Plus } from '@lucide/svelte'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  // Seed local state once; $state makes in-place array mutations here and in Schedule reactive.
  // $derived(data.bookings) would not make the array deeply reactive.
  // svelte-ignore state_referenced_locally
  let bookings = $state(data.bookings)
  let errorMessage = $state<string | undefined>(undefined)
  let dialogMode = $state<Mode | null>(null)
  let selectedScheduleEntry = $state<ScheduleEntry | null>(null)
  // Kind picker before creating (`null` = closed); keeps the selected slot until a kind is chosen.
  let pendingCreate = $state<{ slot?: { start: Date; end: Date } } | null>(null)
  // Update by mouse (drop / resize)
  let mouseUpdateScopeDialogOpen = $state(false)
  let mouseUpdateScopeDialog: {
    requestUpdateScope: (entry: BookingEdit) => Promise<void>
  } | null = $state(null)
  let mouseUpdateRevert: (() => void) | null = null

  const holidays = $derived(data.holidays.map((h) => new Date(h.start as string)))

  async function loadBookings(semester: string) {
    try {
      return await fetchBookings({ semester, kinds: data.bookingKinds, bypassCache: true })
    } catch (err) {
      errorMessage = getErrorMessage(err)
      throw err
    }
  }

  // Calendar callbacks

  function onEventClick(info: EventClickInfo) {
    const props = info.event.extendedProps
    if (props.source === 'booking') {
      dialogMode = {
        id: 'edit',
        entry: toBookingEdit(props.raw),
        metadata: props.raw,
        getSeries: fetchBookingSeriesOccurrences,
        onUpdate: updateEntry,
        onDuplicate: duplicateEntry,
        onDelete: deleteEntry
      }
    } else if (isScheduleLike(props)) {
      selectedScheduleEntry = props.raw
    }
  }

  function onDateSelect(info: DateSelectInfo) {
    pendingCreate = { slot: { start: info.start, end: info.end } }
  }

  function openCreateDialog(kind: BookingKind) {
    const prefilled = pendingCreate?.slot
    pendingCreate = null
    dialogMode = { id: 'create', kind, onCreate: createEntries, prefilled }
  }

  // Note(BK7D2E): Calendar drop/resize/copy handling and the optimistic list updates below mirror
  // Note(BK7D2E) in schedule-planning-editor.svelte. Keep both in sync.

  /** Drop and resize only apply to bookings; the calendar reverts every other source. */
  async function onUpdateByMouse(info: EventDropInfo | EventResizeInfo) {
    if (
      info.extendedProps.source !== 'booking' ||
      info.newStart === null ||
      info.newEnd === null ||
      mouseUpdateScopeDialog === null
    ) {
      info.revert()
      return
    }

    mouseUpdateRevert?.()
    mouseUpdateRevert = info.revert

    try {
      await mouseUpdateScopeDialog.requestUpdateScope(
        toBookingEdit(info.extendedProps.raw, info.newStart, info.newEnd)
      )
    } catch (err) {
      info.revert()
      mouseUpdateRevert = null
      errorMessage = getErrorMessage(err)
    }
  }

  async function updateEntryFromCalendar(entry: BookingEdit, scope: ScheduleEntryUpdateScope) {
    const revert = mouseUpdateRevert
    mouseUpdateRevert = null
    await updateEntry(entry, scope, revert ?? undefined)
  }

  function cancelCalendarUpdate() {
    mouseUpdateRevert?.()
    mouseUpdateRevert = null
  }

  /** Option/Alt + drag copies the booking to the new slot as a single booking. */
  async function onCreateFromCopy(info: EventCopyInfo) {
    if (info.extendedProps.source !== 'booking' || info.newStart === null || info.newEnd === null) {
      return
    }
    // The surplus `id` is stripped by the create schema.
    const entry: BookingCreate = toBookingEdit(info.extendedProps.raw, info.newStart, info.newEnd)
    await createEntries([entry])
  }

  // Remote calls with optimistic list updates

  async function createEntries(entries: BookingCreate[]) {
    try {
      bookings.push(...(await createBookings(entries)))
    } catch (err) {
      errorMessage = getErrorMessage(err)
    } finally {
      dialogMode = null
    }
  }

  async function updateEntry(
    entry: BookingEdit,
    scope: ScheduleEntryUpdateScope,
    onError?: () => void
  ) {
    try {
      const updated =
        scope === 'series' ? await updateBookingSeries(entry) : await updateBooking(entry)
      for (const event of updated) {
        const idx = bookings.findIndex((e) => e.id === event.id)
        if (idx !== -1) {
          bookings[idx] = event
        } else {
          bookings.push(event)
        }
      }
    } catch (err) {
      onError?.()
      errorMessage = getErrorMessage(err)
    } finally {
      dialogMode = null
    }
  }

  async function deleteEntry(id: string) {
    try {
      await deleteBooking(id)
      const idx = bookings.findIndex((e) => e.id === id)
      if (idx !== -1) {
        bookings.splice(idx, 1)
      }
    } catch (err) {
      errorMessage = getErrorMessage(err)
    } finally {
      dialogMode = null
    }
  }

  function duplicateEntry(entry: BookingCreate) {
    dialogMode = null
    setTimeout(() => {
      dialogMode = { id: 'duplicate', entry, onCreate: createEntries }
    }, 100)
  }
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <ErrorMessage bind:message={errorMessage} />

  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Einzelbuchung</h2>
      <p class="text-muted-foreground text-sm">
        Lehrveranstaltungen, Campus-Events und Fakultäts-Events außerhalb der Stundenplanung anlegen
        und bearbeiten.
      </p>
    </div>
    <Button class="shrink-0" onclick={() => (pendingCreate = {})}>
      <Plus class="size-4" />
      Neue Buchung
    </Button>
  </div>

  <ScheduleFilter scheduleFilter={schedulePlanningFilter} canShowFaculty={data.canSeeFaculty} />

  <Schedule
    bypassCache={true}
    loadScheduleEntries={liveScheduleEntryEditorApi.load}
    bind:bookings
    bookingSemester={data.bookingSemester}
    {loadBookings}
    editableSource="booking"
    holidays={data.holidays}
    holidaysMonth={data.holidaysMonth}
    semesterEntries={data.semesterEntries}
    {onEventClick}
    {onDateSelect}
    onEventDrop={onUpdateByMouse}
    onEventResize={onUpdateByMouse}
    onEventCopy={onCreateFromCopy}
    scheduleFilter={schedulePlanningFilter}
  />

  <BookingKindPicker
    open={pendingCreate !== null}
    onSelect={openCreateDialog}
    onClose={() => (pendingCreate = null)}
  />

  {#if dialogMode}
    <BookingEditDialog mode={dialogMode} onClose={() => (dialogMode = null)} {holidays} />
  {/if}

  {#if selectedScheduleEntry}
    <ScheduleEntryDetailsDialog
      entry={selectedScheduleEntry}
      studyPrograms={schedulePlanningFilter.studyProgramsWithSpecialization}
      onClose={() => (selectedScheduleEntry = null)}
    />
  {/if}

  <ScheduleEntryUpdateScopeDialog
    bind:this={mouseUpdateScopeDialog}
    bind:open={mouseUpdateScopeDialogOpen}
    onUpdate={updateEntryFromCalendar}
    onCancel={cancelCalendarUpdate}
    getSeries={fetchBookingSeriesOccurrences}
  />
</div>
