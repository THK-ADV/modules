<script lang="ts">
  import { browser } from '$app/environment'
  import BookingDetailsDialog from '$lib/components/schedule/booking-details-dialog.svelte'
  import BookingEditDialog, {
    type Mode as BookingMode
  } from '$lib/components/schedule/booking-edit-dialog.svelte'
  import BookingKindPicker from '$lib/components/schedule/booking-kind-picker.svelte'
  import {
    createBookings,
    deleteBooking,
    fetchBookingSeriesOccurrences,
    fetchBookings,
    updateBooking,
    updateBookingSeries
  } from '$lib/components/schedule/booking.remote'
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js'
  import { Toggle } from '$lib/components/ui/toggle/index.js'
  import {
    toBookingEdit,
    type BookingCreate,
    type BookingEdit,
    type BookingKind,
    type CampusBooking,
    type TeachingBooking
  } from '$lib/types/booking'
  import {
    isScheduleLike,
    type BookingEventProps,
    type CalendarEvent,
    type DateSelectInfo,
    type EventClickInfo,
    type EventCopyInfo,
    type EventDropInfo,
    type EventResizeInfo,
    type ScheduleEventProps
  } from '$lib/calendar'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import ScheduleEntryDetailsDialog from '$lib/components/schedule/schedule-entry-details-dialog.svelte'
  import ScheduleEntryEditDialog, {
    type Mode
  } from '$lib/components/schedule/schedule-entry-edit-dialog.svelte'
  import ScheduleEntryUpdateScopeDialog from '$lib/components/schedule/schedule-entry-update-scope-dialog.svelte'
  import type { ScheduleEntryEditorApi } from '$lib/components/schedule/schedule-entry-editor-api'
  import ScheduleFilter from '$lib/components/schedule/schedule-filter.svelte'
  import Schedule from '$lib/components/schedule/schedule.svelte'
  import { getErrorMessage } from '$lib/errors'
  import { Label } from '$lib/components/ui/label/index.js'
  import { schedulePlanningFilter } from '$lib/stores/schedule-filter.svelte'
  import type {
    ScheduleEntry,
    ScheduleEntryCreate,
    ScheduleEntryEdit,
    ScheduleEntryUpdateScope
  } from '$lib/types/schedule'
  import type {
    CalendarEvent as HolidayCalendarEvent,
    HolidayEventProps,
    SemesterPlanEventProps
  } from '$lib/calendar'
  import { TriangleAlert } from '@lucide/svelte'
  import type { Snippet } from 'svelte'

  interface CalendarData {
    holidays: HolidayCalendarEvent<HolidayEventProps>[]
    holidaysMonth: HolidayCalendarEvent<HolidayEventProps>[]
    semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
    bookings: CalendarEvent<BookingEventProps>[]
    bookingSemester: string
    bookingKinds: BookingKind[]
    canSeeFaculty: boolean
  }

  interface Props {
    calendarData: CalendarData
    api: ScheduleEntryEditorApi
    canEdit: boolean
    toolbar?: Snippet
  }

  let { calendarData, api, canEdit, toolbar }: Props = $props()

  // UI control
  let showConflicts = $state(false)
  let createMode = $state<'schedule' | 'booking'>(
    browser && localStorage.getItem('spf-create-mode') === 'booking' ? 'booking' : 'schedule'
  )

  function setCreateMode(mode: string) {
    if (mode !== 'schedule' && mode !== 'booking') return
    createMode = mode
    if (browser) localStorage.setItem('spf-create-mode', mode)
  }

  // Data
  let scheduleEntries = $state<CalendarEvent<ScheduleEventProps>[]>([])
  // svelte-ignore state_referenced_locally
  let bookings = $state(calendarData.bookings)
  let bookingDialogMode = $state<BookingMode | null>(null)
  let selectedBooking = $state<CampusBooking | null>(null)
  let pendingBookingSlot = $state<{ start: Date; end: Date } | null>(null)
  let bookingMouseUpdateScopeDialog: {
    requestUpdateScope: (entry: BookingEdit) => Promise<void>
  } | null = $state(null)
  // Actions: create, update, delete, duplicate entries
  let errorMessage = $state<string | undefined>(undefined)
  let dialogMode: Mode | null = $state(null)
  let selectedScheduleEntry = $state<ScheduleEntry | TeachingBooking | null>(null)
  // Actions: update entry by mouse
  let mouseUpdateScopeDialogOpen = $state(false)
  let mouseUpdateScopeDialog: {
    requestUpdateScope: (entry: ScheduleEntryEdit) => Promise<void>
  } | null = $state(null)
  let mouseUpdateRevert: (() => void) | null = null

  // Dialog callbacks specific to ScheduleEntryEdit and ScheduleEntryCreate

  function onUpdateEntry(info: EventClickInfo) {
    if (info.event.extendedProps.source === 'booking') {
      const raw = info.event.extendedProps.raw
      bookingDialogMode = {
        id: 'edit',
        entry: toBookingEdit(raw),
        metadata: raw,
        getSeries: fetchBookingSeriesOccurrences,
        onUpdate: updateBookingEntry,
        onDuplicate: duplicateBookingEntry,
        onDelete: deleteBookingEntry
      }
      return
    }
    if (info.event.extendedProps?.source !== 'schedule') {
      return
    }

    const raw = info.event.extendedProps.raw
    dialogMode = {
      id: 'edit',
      entry: {
        id: raw.id,
        module: raw.module,
        courseType: raw.courseType,
        start: new Date(raw.start),
        end: new Date(raw.end),
        rooms: raw.rooms.map(({ id }) => id),
        po: raw.po.map((po) => ({
          ...po,
          recommendedSemester: [...po.recommendedSemester]
        })),
        lecturer: raw.lecturer.map(({ id }) => id),
        seriesId: raw.seriesId
      },
      getSeries: api.getSeries,
      onUpdate: updateEntry,
      onDuplicate: duplicateEntry,
      onDelete: deleteEntry
    }
  }

  function onViewEntry(info: EventClickInfo) {
    const props = info.event.extendedProps
    if (isScheduleLike(props)) {
      selectedScheduleEntry = props.raw
    } else if (props.source === 'booking') {
      selectedBooking = props.raw
    }
  }

  function onCreateFromSelection(info: DateSelectInfo) {
    if (createMode === 'booking') {
      pendingBookingSlot = { start: info.start, end: info.end }
      return
    }
    openCreateEntryDialog({
      start: info.start,
      end: info.end
    })
  }

  /** Called when a user drags and drops an event on the calendar */
  async function onUpdateByDrop(info: EventDropInfo) {
    await requestUpdateFromCalendar(info)
  }

  /** Called when a user resizes an event on the calendar */
  async function onUpdateByResize(info: EventResizeInfo) {
    await requestUpdateFromCalendar(info)
  }

  function createUpdateEntryFromCalendar(info: EventDropInfo | EventResizeInfo) {
    if (
      info.extendedProps.source !== 'schedule' ||
      info.newStart === null ||
      info.newEnd === null
    ) {
      return null
    }

    const raw = info.extendedProps.raw
    return {
      id: raw.id,
      module: raw.module,
      courseType: raw.courseType,
      start: info.newStart,
      end: info.newEnd,
      rooms: raw.rooms.map(({ id }) => id),
      po: raw.po.map((po) => ({
        ...po,
        recommendedSemester: [...po.recommendedSemester]
      })),
      lecturer: raw.lecturer.map(({ id }) => id),
      seriesId: raw.seriesId
    }
  }

  // Note(BK7D2E): Calendar drop/resize/copy handling and the optimistic list updates below mirror
  // Note(BK7D2E) in routes/planning/bookings/+page.svelte. Keep both in sync.
  async function requestUpdateFromCalendar(info: EventDropInfo | EventResizeInfo) {
    if (info.extendedProps.source === 'booking') {
      if (
        info.newStart === null ||
        info.newEnd === null ||
        bookingMouseUpdateScopeDialog === null
      ) {
        info.revert()
        return
      }
      mouseUpdateRevert?.()
      mouseUpdateRevert = info.revert
      try {
        await bookingMouseUpdateScopeDialog.requestUpdateScope(
          toBookingEdit(info.extendedProps.raw, info.newStart, info.newEnd)
        )
      } catch (err) {
        info.revert()
        mouseUpdateRevert = null
        errorMessage = getErrorMessage(err)
      }
      return
    }

    const entry = createUpdateEntryFromCalendar(info)

    if (entry === null) {
      info.revert()
      return
    }

    mouseUpdateRevert?.()
    mouseUpdateRevert = info.revert

    if (mouseUpdateScopeDialog === null) {
      info.revert()
      mouseUpdateRevert = null
      return
    }

    try {
      await mouseUpdateScopeDialog.requestUpdateScope(entry)
    } catch (err) {
      info.revert()
      mouseUpdateRevert = null
      errorMessage = getErrorMessage(err)
    }
  }

  async function updateEntryFromCalendar(
    entry: ScheduleEntryEdit,
    scope: ScheduleEntryUpdateScope
  ) {
    const revert = mouseUpdateRevert
    mouseUpdateRevert = null
    await updateEntry(entry, scope, { onError: revert ?? undefined })
  }

  function cancelCalendarUpdate() {
    mouseUpdateRevert?.()
    mouseUpdateRevert = null
  }

  /** Called when a user copies an event on the calendar by alt + drag */
  async function onCreateFromCopy(info: EventCopyInfo) {
    if (info.extendedProps.source === 'booking' && info.newStart !== null && info.newEnd !== null) {
      await createBookingEntries([
        toBookingEdit(info.extendedProps.raw, info.newStart, info.newEnd)
      ])
      return
    }
    if (
      info.extendedProps.source !== 'schedule' ||
      info.newStart === null ||
      info.newEnd === null
    ) {
      return
    }

    const raw = info.extendedProps.raw
    await createEntry([
      {
        module: raw.module,
        courseType: raw.courseType,
        start: info.newStart,
        end: info.newEnd,
        rooms: raw.rooms.map(({ id }) => id),
        po: raw.po.map((po) => ({
          ...po,
          recommendedSemester: [...po.recommendedSemester]
        })),
        lecturer: raw.lecturer.map(({ id }) => id),
        seriesId: raw.seriesId
      }
    ])
  }

  function resetDialog() {
    dialogMode = null
  }

  // Call remote functions

  async function createEntry(entries: ScheduleEntryCreate[]) {
    try {
      const createdEntries = await api.create(entries)
      // prefer optimistic update over server update
      scheduleEntries.push(...createdEntries)
    } catch (err) {
      errorMessage = getErrorMessage(err)
    } finally {
      resetDialog()
    }
  }

  function replaceScheduleEntries(updatedEntries: CalendarEvent<ScheduleEventProps>[]) {
    for (const updatedEntry of updatedEntries) {
      const idx = scheduleEntries.findIndex((e) => e.id === updatedEntry.id)
      if (idx !== -1) {
        scheduleEntries[idx] = updatedEntry
      } else {
        scheduleEntries.push(updatedEntry)
      }
    }
  }

  async function updateEntry(
    entry: ScheduleEntryEdit,
    scope: ScheduleEntryUpdateScope,
    options?: { onError?: () => void }
  ) {
    try {
      const updatedEntries = await api.update(entry, scope)
      replaceScheduleEntries(updatedEntries)
    } catch (err) {
      options?.onError?.()
      errorMessage = getErrorMessage(err)
    } finally {
      resetDialog()
    }
  }

  async function deleteEntry(id: string) {
    try {
      await api.delete(id)
      // prefer optimistic update over server delete
      const idx = scheduleEntries.findIndex((e) => e.id === id)
      if (idx !== -1) {
        scheduleEntries.splice(idx, 1)
      }
    } catch (err) {
      errorMessage = getErrorMessage(err)
    } finally {
      resetDialog()
    }
  }

  function duplicateEntry(entry: ScheduleEntryCreate) {
    resetDialog()
    setTimeout(() => {
      dialogMode = {
        id: 'duplicate',
        entry,
        onCreate: createEntry
      }
    }, 100)
  }

  function openCreateEntryDialog(prefilled?: Partial<ScheduleEntryCreate>) {
    dialogMode = {
      id: 'create',
      onCreate: createEntry,
      prefilled
    }
  }

  async function loadBookings(semester: string) {
    try {
      return await fetchBookings({ semester, kinds: calendarData.bookingKinds, bypassCache: true })
    } catch (err) {
      errorMessage = getErrorMessage(err)
      throw err
    }
  }

  function openCreateBookingDialog(kind: BookingKind) {
    const prefilled = pendingBookingSlot ?? undefined
    pendingBookingSlot = null
    bookingDialogMode = { id: 'create', kind, onCreate: createBookingEntries, prefilled }
  }

  async function createBookingEntries(entries: BookingCreate[]) {
    try {
      bookings.push(...(await createBookings(entries)))
    } catch (err) {
      errorMessage = getErrorMessage(err)
    } finally {
      bookingDialogMode = null
    }
  }

  async function updateBookingEntry(
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
      bookingDialogMode = null
    }
  }

  async function updateBookingFromCalendar(entry: BookingEdit, scope: ScheduleEntryUpdateScope) {
    const revert = mouseUpdateRevert
    mouseUpdateRevert = null
    await updateBookingEntry(entry, scope, revert ?? undefined)
  }

  async function deleteBookingEntry(id: string) {
    try {
      await deleteBooking(id)
      const idx = bookings.findIndex((e) => e.id === id)
      if (idx !== -1) bookings.splice(idx, 1)
    } catch (err) {
      errorMessage = getErrorMessage(err)
    } finally {
      bookingDialogMode = null
    }
  }

  function duplicateBookingEntry(entry: BookingCreate) {
    bookingDialogMode = null
    setTimeout(() => {
      bookingDialogMode = { id: 'duplicate', entry, onCreate: createBookingEntries }
    }, 100)
  }

  function getHolidays() {
    return calendarData.holidays.map((a) => new Date(a.start as string))
  }
</script>

<div class="flex min-h-0 flex-1 flex-col gap-8">
  <ErrorMessage bind:message={errorMessage} />

  <ScheduleFilter
    scheduleFilter={schedulePlanningFilter}
    canShowFaculty={calendarData.canSeeFaculty}
  />

  <div class="flex min-h-0 flex-1 flex-col gap-6">
    <div
      role="group"
      aria-label="Kalenderwerkzeuge"
      class="flex flex-wrap items-center gap-x-6 gap-y-3"
    >
      {#if canEdit}
        <div class="flex flex-wrap items-center gap-3">
          <span id="create-mode-label" class="text-muted-foreground text-sm font-medium md:w-20">
            Anlegen
          </span>
          <RadioGroup.Root
            bind:value={() => createMode, setCreateMode}
            aria-labelledby="create-mode-label"
            orientation="horizontal"
            class="bg-muted flex gap-1 rounded-lg p-1"
          >
            <div class="relative">
              <RadioGroup.Item id="create-schedule" value="schedule" class="peer sr-only" />
              <Label
                for="create-schedule"
                class="text-muted-foreground hover:text-foreground peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-foreground peer-data-[state=checked]:shadow-sm peer-focus-visible:ring-ring flex h-9 cursor-pointer items-center rounded-md px-3 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
              >
                Stundenplan
              </Label>
            </div>
            <div class="relative">
              <RadioGroup.Item id="create-booking" value="booking" class="peer sr-only" />
              <Label
                for="create-booking"
                class="text-muted-foreground hover:text-foreground peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-foreground peer-data-[state=checked]:shadow-sm peer-focus-visible:ring-ring flex h-9 cursor-pointer items-center rounded-md px-3 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
              >
                Einzelbuchung
              </Label>
            </div>
          </RadioGroup.Root>
        </div>
      {/if}

      <Toggle
        bind:pressed={showConflicts}
        variant="outline"
        class="data-[state=on]:border-destructive/40 data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive gap-2"
      >
        <TriangleAlert aria-hidden="true" />
        Konflikte anzeigen
      </Toggle>

      {#if toolbar}
        {@render toolbar()}
      {/if}
    </div>

    <Schedule
      bypassCache={true}
      loadScheduleEntries={api.load}
      bind:scheduleEntries
      bind:bookings
      bookingSemester={calendarData.bookingSemester}
      {loadBookings}
      editableSource={['schedule', 'booking']}
      holidays={calendarData.holidays}
      holidaysMonth={calendarData.holidaysMonth}
      semesterEntries={calendarData.semesterEntries}
      onEventClick={canEdit ? onUpdateEntry : onViewEntry}
      onDateSelect={canEdit ? onCreateFromSelection : undefined}
      onEventDrop={canEdit ? onUpdateByDrop : undefined}
      onEventCopy={canEdit ? onCreateFromCopy : undefined}
      onEventResize={canEdit ? onUpdateByResize : undefined}
      scheduleFilter={schedulePlanningFilter}
    />
  </div>

  {#if canEdit}
    <BookingKindPicker
      open={pendingBookingSlot !== null}
      onSelect={openCreateBookingDialog}
      onClose={() => (pendingBookingSlot = null)}
    />

    {#if bookingDialogMode}
      <BookingEditDialog
        mode={bookingDialogMode}
        onClose={() => (bookingDialogMode = null)}
        holidays={getHolidays()}
      />
    {/if}

    <ScheduleEntryUpdateScopeDialog
      bind:this={bookingMouseUpdateScopeDialog}
      onUpdate={updateBookingFromCalendar}
      onCancel={cancelCalendarUpdate}
      getSeries={fetchBookingSeriesOccurrences}
    />
  {/if}

  {#if selectedBooking}
    <BookingDetailsDialog booking={selectedBooking} onClose={() => (selectedBooking = null)} />
  {/if}

  {#if dialogMode}
    <ScheduleEntryEditDialog mode={dialogMode} onClose={resetDialog} holidays={getHolidays()} />
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
    getSeries={api.getSeries}
  />
</div>
