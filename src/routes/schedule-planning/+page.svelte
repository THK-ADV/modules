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
  import ScheduleDraftPanel from '$lib/components/schedule/schedule-draft-panel.svelte'
  import ScheduleEntryEditDialog, {
    type Mode
  } from '$lib/components/schedule/schedule-entry-edit-dialog.svelte'
  import ScheduleFilter from '$lib/components/schedule/schedule-filter.svelte'
  import Schedule from '$lib/components/schedule/schedule.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { schedulePlanningFilter } from '$lib/stores/store.svelte'
  import type { ScheduleEntryCreate, ScheduleEntryEdit } from '$lib/types/schedule'
  import { Calendar, PanelRight, Table2, TriangleAlert } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ScheduleTable from '$lib/components/schedule/schedule-table.svelte'

  const { data }: PageProps = $props()

  let selectedTab = $state('calendar') // calendar or table

  let isDraftPanelOpen = $state(false)

  let showConflicts = $state(false)

  let sourceEventCounts = $state({
    holiday: 0,
    semesterPlan: 0,
    schedule: 0,
    exam: 0
  })

  let scheduleEntries = $state<CalendarEvent<ScheduleEventProps>[]>([])

  // Fetch schedule entries when the date range changes
  function fetchScheduleEntries(info: DateRangeInfo) {
    return fetch(`/schedule-planning?start=${info.start.getTime()}&end=${info.end.getTime()}`)
  }

  // Create, update, delete, duplicate schedule entries

  let errorMessage = $state<string | undefined>(undefined)

  let dialogMode: Mode | null = $state(null)

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
        props: raw.props
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
    const updatedEntry: ScheduleEntryEdit = {
      id: raw.id,
      module: raw.module,
      courseType: raw.courseType,
      start: info.newStart,
      end: info.newEnd,
      rooms: raw.rooms.map(({ id }) => id),
      props: raw.props
    }
    await updateEntry(updatedEntry)
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
    const updatedEntry: ScheduleEntryEdit = {
      id: raw.id,
      module: raw.module,
      courseType: raw.courseType,
      start: info.newStart,
      end: info.newEnd,
      rooms: raw.rooms.map(({ id }) => id),
      props: raw.props
    }
    await updateEntry(updatedEntry)
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
    const newEntry: ScheduleEntryCreate = {
      module: raw.module,
      courseType: raw.courseType,
      start: info.newStart,
      end: info.newEnd,
      rooms: raw.rooms.map(({ id }) => id),
      props: raw.props
    }
    await createEntry([newEntry])
  }

  function resetDialog() {
    dialogMode = null
  }

  async function createEntry(entries: ScheduleEntryCreate[]) {
    try {
      const resp = await fetch('/schedule-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries)
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: resp.statusText }))
        errorMessage = err.message
        return
      }

      const createdEntries: CalendarEvent<ScheduleEventProps>[] = await resp.json()
      scheduleEntries.push(...createdEntries)
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Fehler beim Erstellen der Einträge'
    } finally {
      resetDialog()
    }
  }

  async function updateEntry(entry: ScheduleEntryEdit) {
    try {
      const resp = await fetch('/schedule-planning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: resp.statusText }))
        errorMessage = err.message
        return
      }

      // prefer optimistic update over server update
      const updatedEntry: CalendarEvent<ScheduleEventProps> = await resp.json()
      const idx = scheduleEntries.findIndex((e) => e.id === updatedEntry.id)
      if (idx !== -1) {
        scheduleEntries[idx] = updatedEntry
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Einträge'
    } finally {
      resetDialog()
    }
  }

  async function deleteEntry(id: string) {
    try {
      const resp = await fetch(`/schedule-planning?id=${id}`, {
        method: 'DELETE'
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: resp.statusText }))
        errorMessage = err.message
        return
      }

      // prefer optimistic update over server delete
      const idx = scheduleEntries.findIndex((e) => e.id === id)
      if (idx !== -1) {
        scheduleEntries.splice(idx, 1)
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Fehler beim Löschen der Einträge'
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
    return data.holidays.map((a) => new Date(a.start))
  }
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <ErrorMessage bind:message={errorMessage} />

  <h2 class="text-3xl font-bold tracking-tight">Stundenplanung</h2>

  <ScheduleFilter {sourceEventCounts} scheduleFilter={schedulePlanningFilter} />

  <div class="flex min-h-0 flex-1">
    <div class="flex min-w-0 flex-1 flex-col">
      <Tabs.Root bind:value={selectedTab}>
        <div class="flex items-center justify-between pe-4">
          <!-- Tabs -->
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

          <!-- Conflict toggle -->
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

          <!-- Draft Panel Toggle -->
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button
                variant={isDraftPanelOpen ? 'secondary' : 'ghost'}
                size="sm"
                onclick={() => (isDraftPanelOpen = !isDraftPanelOpen)}
              >
                <PanelRight class="size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {isDraftPanelOpen ? 'Entwürfe ausblenden' : 'Entwürfe einblenden'}
            </Tooltip.Content>
          </Tooltip.Root>
        </div>

        <Tabs.Content value="calendar">
          <Schedule
            scheduleFetcher={fetchScheduleEntries}
            bind:sourceEventCounts
            bind:scheduleEntries
            holidays={data.holidays}
            semesterEntries={data.semesterEntries}
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

    <!-- TODO: Align the draft panel with the schedule header -->

    <!-- Draft Panel -->
    {#if isDraftPanelOpen}
      <div class="border-border w-80 shrink-0 border-l">
        <ScheduleDraftPanel
          entries={[]}
          onEntryClick={() => {}}
          onNewEntryClick={() => openCreateEntryDialog()}
        />
      </div>
    {/if}
  </div>

  {#if dialogMode}
    <ScheduleEntryEditDialog mode={dialogMode} onClose={resetDialog} holidays={getHolidays()} />
  {/if}
</div>
