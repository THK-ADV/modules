<script lang="ts">
  import { type EventClickInfo } from '$lib/calendar'
  import ScheduleEntryDetailsDialog from '$lib/components/schedule/schedule-entry-details-dialog.svelte'
  import { liveScheduleEntryEditorApi } from '$lib/components/schedule/schedule-entry-editor-api'
  import ScheduleFilter from '$lib/components/schedule/schedule-filter.svelte'
  import Schedule from '$lib/components/schedule/schedule.svelte'
  import { scheduleFilter } from '$lib/stores/schedule-filter.svelte'
  import type { ScheduleEntry } from '$lib/types/schedule'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  let selectedScheduleEntry = $state<ScheduleEntry | null>(null)

  function onEventClick(info: EventClickInfo) {
    if (info.event.extendedProps?.source !== 'schedule') {
      return
    }
    selectedScheduleEntry = info.event.extendedProps.raw
  }
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Semesterkalender</h2>
    <p class="text-muted-foreground text-sm">
      Kalender mit Einträgen zum Stundenplan, Prüfungen, Semesterplan und Feiertagen.
    </p>
  </div>

  <ScheduleFilter {scheduleFilter} />

  <Schedule
    holidays={data.holidays}
    holidaysMonth={data.holidaysMonth}
    semesterEntries={data.semesterEntries}
    {onEventClick}
    {scheduleFilter}
    bypassCache={false}
    loadScheduleEntries={liveScheduleEntryEditorApi.load}
  />

  {#if selectedScheduleEntry}
    <ScheduleEntryDetailsDialog
      onClose={() => (selectedScheduleEntry = null)}
      entry={selectedScheduleEntry}
      studyPrograms={scheduleFilter.studyProgramsWithSpecialization}
    />
  {/if}
</div>
