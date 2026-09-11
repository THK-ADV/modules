<script lang="ts">
  import { browser } from '$app/environment'
  import { type EventClickInfo } from '$lib/calendar'
  import ScheduleEntryDetailsDialog from '$lib/components/schedule/schedule-entry-details-dialog.svelte'
  import { liveScheduleEntryEditorApi } from '$lib/components/schedule/schedule-entry-editor-api'
  import ScheduleFilter from '$lib/components/schedule/schedule-filter.svelte'
  import Schedule from '$lib/components/schedule/schedule.svelte'
  import { getBooleanFromLocalStorage, setBooleanToLocalStorage } from '$lib/stores/local-storage'
  import { scheduleFilter } from '$lib/stores/schedule-filter.svelte'
  import type { ScheduleEntry } from '$lib/types/schedule'
  import { TriangleAlert, X } from '@lucide/svelte'
  import type { PageProps } from './$types'

  const HINT_STORAGE_KEY = 'schedule-intro-week-hint-read'

  const { data }: PageProps = $props()

  let selectedScheduleEntry = $state<ScheduleEntry | null>(null)
  let hintRead = $state(getBooleanFromLocalStorage(HINT_STORAGE_KEY, false))

  function dismissHint() {
    hintRead = true
    setBooleanToLocalStorage(HINT_STORAGE_KEY, true)
  }

  function onEventClick(info: EventClickInfo) {
    if (info.event.extendedProps?.source !== 'schedule') {
      return
    }
    selectedScheduleEntry = info.event.extendedProps.raw
  }
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  {#if browser && !hintRead}
    <div
      class="max-w-2xl overflow-hidden rounded-xl border border-amber-500/40 bg-linear-to-br from-amber-500/12 via-amber-500/8 to-amber-600/6 shadow-sm ring-1 ring-amber-500/20 dark:border-amber-400/50 dark:from-amber-400/10 dark:via-amber-400/6 dark:to-amber-500/5 dark:ring-amber-400/25"
    >
      <div class="flex items-start gap-3 p-4">
        <TriangleAlert
          class="size-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <p class="flex-1 text-sm leading-snug text-amber-800 dark:text-amber-300">
          Prüfen Sie für jedes Modul im entsprechenden ILU-Kurs nach, wann die
          Einführungsveranstaltungen tatsächlich stattfinden.
        </p>
        <button
          type="button"
          class="flex size-5 shrink-0 items-center justify-center rounded-sm text-amber-700 transition-colors hover:bg-amber-500/25 focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:outline-none dark:text-amber-300 dark:hover:bg-amber-400/20 dark:focus-visible:ring-amber-400/50"
          aria-label="Hinweis schließen"
          onclick={dismissHint}
        >
          <X class="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  {/if}

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
