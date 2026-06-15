<script lang="ts">
  import {
    type CalendarEvent,
    type DateRangeInfo,
    type DateSelectInfo,
    type EventClickInfo,
    type EventCopyInfo,
    type EventDropInfo,
    type EventResizeInfo,
    type ScheduleEventProps
  } from '$lib/calendar'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import ScheduleEntryEditDialog, {
    type Mode
  } from '$lib/components/schedule/schedule-entry-edit-dialog.svelte'
  import ScheduleFilter from '$lib/components/schedule/schedule-filter.svelte'
  import Schedule from '$lib/components/schedule/schedule.svelte'
  import ScheduleTable from '$lib/components/schedule/schedule-table.svelte'
  import { getErrorMessage } from '$lib/errors'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import { schedulePlanningFilter } from '$lib/stores/schedule-filter.svelte'
  import type {
    ScheduleEntryCreate,
    ScheduleEntryEdit,
    ScheduleEntryUpdateScope
  } from '$lib/types/schedule'
  import type {
    CalendarEvent as HolidayCalendarEvent,
    HolidayEventProps,
    SemesterPlanEventProps
  } from '$lib/calendar'
  import {
    createLiveScheduleEntries,
    deleteLiveScheduleEntry,
    fetchLiveScheduleEntries,
    updateLiveScheduleEntry,
    updateLiveScheduleEntrySeries
  } from '$lib/components/schedule/schedule.remote'
  import { Calendar, Table2, TriangleAlert } from '@lucide/svelte'
  import type { Snippet } from 'svelte'

  interface CalendarData {
    holidays: HolidayCalendarEvent<HolidayEventProps>[]
    holidaysMonth: HolidayCalendarEvent<HolidayEventProps>[]
    semesterEntries: CalendarEvent<SemesterPlanEventProps>[]
  }

  interface Props {
    calendarData: CalendarData
    toolbar?: Snippet
  }

  let { calendarData, toolbar }: Props = $props()

  // UI control
  let selectedTab = $state('calendar')
  let showConflicts = $state(false)
  // Data
  let scheduleEntries = $state<CalendarEvent<ScheduleEventProps>[]>([])
  // Actions: create, update, delete, duplicate entries
  let errorMessage = $state<string | undefined>(undefined)
  let dialogMode: Mode | null = $state(null)

  // Dialog callbacks specific to ScheduleEntryEdit and ScheduleEntryCreate

  function onUpdateEntry(info: EventClickInfo) {
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
        props: raw.props,
        seriesId: raw.seriesId
      },
      onUpdate: updateEntry,
      onDuplicate: duplicateEntry,
      onDelete: deleteEntry
    }
  }

  function onCreateFromSelection(info: DateSelectInfo) {
    openCreateEntryDialog({
      start: info.start,
      end: info.end
    })
  }

  async function onUpdateByDrop(info: EventDropInfo) {
    if (
      info.extendedProps.source !== 'schedule' ||
      info.newStart === null ||
      info.newEnd === null
    ) {
      return
    }

    const raw = info.extendedProps.raw
    await updateEntry({
      id: raw.id,
      module: raw.module,
      courseType: raw.courseType,
      start: info.newStart,
      end: info.newEnd,
      rooms: raw.rooms.map(({ id }) => id),
      props: raw.props,
      seriesId: raw.seriesId
    })
  }

  async function onUpdateByResize(info: EventResizeInfo) {
    if (
      info.extendedProps.source !== 'schedule' ||
      info.newStart === null ||
      info.newEnd === null
    ) {
      return
    }

    const raw = info.extendedProps.raw
    await updateEntry({
      id: raw.id,
      module: raw.module,
      courseType: raw.courseType,
      start: info.newStart,
      end: info.newEnd,
      rooms: raw.rooms.map(({ id }) => id),
      props: raw.props,
      seriesId: raw.seriesId
    })
  }

  async function onCreateFromCopy(info: EventCopyInfo) {
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
        props: raw.props,
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
      const createdEntries = await createLiveScheduleEntries(entries)
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

  async function updateEntry(entry: ScheduleEntryEdit, scope: ScheduleEntryUpdateScope = 'single') {
    try {
      if (scope === 'series') {
        const updatedEntries = await updateLiveScheduleEntrySeries(entry)
        replaceScheduleEntries(updatedEntries)
      } else {
        const updatedEntry = await updateLiveScheduleEntry(entry)
        replaceScheduleEntries([updatedEntry])
      }
    } catch (err) {
      errorMessage = getErrorMessage(err)
    } finally {
      resetDialog()
    }
  }

  async function deleteEntry(id: string) {
    try {
      await deleteLiveScheduleEntry(id)
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

  function getHolidays() {
    return calendarData.holidays.map((a) => new Date(a.start as string))
  }
</script>

<div class="flex min-h-0 flex-1 flex-col space-y-8">
  <ErrorMessage bind:message={errorMessage} />

  <ScheduleFilter scheduleFilter={schedulePlanningFilter} />

  <div class="flex min-h-0 flex-1 flex-col">
    <Tabs.Root bind:value={selectedTab}>
      <div class="flex flex-wrap items-center justify-between gap-3 pe-4">
        <Tabs.List>
          <Tabs.Trigger value="calendar">
            <Calendar class="mr-2 size-4" />
            Kalender
          </Tabs.Trigger>
          <Tabs.Trigger value="table">
            <Table2 class="mr-2 size-4" />
            Tabelle
          </Tabs.Trigger>
        </Tabs.List>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <Switch id="show-conflicts" bind:checked={showConflicts} />
            <Label
              for="show-conflicts"
              class="flex cursor-pointer items-center gap-1.5 text-sm font-normal"
            >
              <TriangleAlert class="text-destructive size-4" />
              Konflikte anzeigen
            </Label>
          </div>

          {#if toolbar}
            {@render toolbar()}
          {/if}
        </div>
      </div>

      <Tabs.Content value="calendar">
        <Schedule
          bypassCache={true}
          bind:scheduleEntries
          holidays={calendarData.holidays}
          holidaysMonth={calendarData.holidaysMonth}
          semesterEntries={calendarData.semesterEntries}
          onEventClick={onUpdateEntry}
          onDateSelect={onCreateFromSelection}
          onEventDrop={onUpdateByDrop}
          onEventCopy={onCreateFromCopy}
          onEventResize={onUpdateByResize}
          scheduleFilter={schedulePlanningFilter}
        />
      </Tabs.Content>
      <Tabs.Content value="table">
        <ScheduleTable />
      </Tabs.Content>
    </Tabs.Root>
  </div>

  {#if dialogMode}
    <ScheduleEntryEditDialog mode={dialogMode} onClose={resetDialog} holidays={getHolidays()} />
  {/if}
</div>
