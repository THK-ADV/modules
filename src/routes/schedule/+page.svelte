<script lang="ts">
  import {
    getDefaultCalendarView,
    type CalendarView,
    type DateRangeInfo,
    type EventClickInfo
  } from '$lib/calendar'
  import ScheduleEntryDetailsDialog from '$lib/components/schedule/schedule-entry-details-dialog.svelte'
  import ScheduleFilter from '$lib/components/schedule/schedule-filter.svelte'
  import Schedule from '$lib/components/schedule/schedule.svelte'
  import { scheduleFilter } from '$lib/store.svelte'
  import type { ScheduleEntry } from '$lib/types/schedule'
  import { TriangleAlert } from '@lucide/svelte'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  const initialView = $derived(
    (data.selectedCalendarView || getDefaultCalendarView()) as CalendarView
  )
  const initialDate = $derived(data.selectedCalendarDate || new Date().toISOString())

  let selectedScheduleEntry = $state<ScheduleEntry | null>(null)

  let sourceEventCounts = $state({
    holiday: 0,
    semesterPlan: 0,
    schedule: 0,
    exam: 0
  })

  function onEventClick(info: EventClickInfo) {
    if (info.event.extendedProps?.source !== 'schedule') {
      return
    }
    selectedScheduleEntry = info.event.extendedProps.raw
  }

  // Fetch schedule entries when the date range changes
  function fetchScheduleEntries(info: DateRangeInfo) {
    return fetch(`/schedule?start=${info.start.getTime()}&end=${info.end.getTime()}`)
  }
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <!-- Disclaimer -->
  <div
    class="rounded-lg border-2 border-amber-500/50 bg-amber-500/10 p-4 dark:border-amber-400/50 dark:bg-amber-400/10"
  >
    <div class="flex items-start gap-3">
      <TriangleAlert class="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div class="space-y-2 text-sm text-amber-800 dark:text-amber-300">
        <div class="font-semibold text-amber-900 dark:text-amber-200">
          Neuer Kalender – In Entwicklung
        </div>
        <p>
          Dies ist die neue Implementierung des Stundenplans. Da sich das Feature noch in aktiver
          Entwicklung befindet, können die angezeigten Daten fehlerhaft sein. Der offizielle
          Stundenplan bleibt weiterhin im
          <a
            href="https://hops.gm.th-koeln.de/hops/modules/timetable"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
          >
            HOPS
          </a>
          verfügbar.
        </p>
        <p>
          Feedback und Fehlerberichte bitte an
          <a
            href="mailto:schedule-dev@gm.fh-koeln.de"
            class="font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
          >
            schedule-dev@gm.fh-koeln.de
          </a>
          senden oder ein
          <a
            href="https://github.com/THK-ADV/modules/issues"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
            >GitHub Issue</a
          > erstellen.
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Kalender</h2>
    <p class="text-muted-foreground text-sm">
      Kalender mit Einträgen zum Stundenplan, Prüfungen, Semesterplan und Feiertagen.
    </p>
  </div>

  <ScheduleFilter {sourceEventCounts} {scheduleFilter} />

  <Schedule
    bind:sourceEventCounts
    holidays={data.holidays}
    semesterEntries={data.semesterEntries}
    {initialView}
    {initialDate}
    {onEventClick}
    {scheduleFilter}
    scheduleFetcher={fetchScheduleEntries}
  />

  {#if selectedScheduleEntry}
    <ScheduleEntryDetailsDialog
      onClose={() => (selectedScheduleEntry = null)}
      entry={selectedScheduleEntry}
      studyPrograms={scheduleFilter.studyPrograms}
    />
  {/if}
</div>
