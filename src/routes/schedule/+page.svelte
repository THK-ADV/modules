<script lang="ts">
  import { type DateRangeInfo, type EventClickInfo } from '$lib/calendar'
  import ScheduleEntryDetailsDialog from '$lib/components/schedule/schedule-entry-details-dialog.svelte'
  import ScheduleFilter from '$lib/components/schedule/schedule-filter.svelte'
  import Schedule from '$lib/components/schedule/schedule.svelte'
  import { scheduleFilter } from '$lib/stores/schedule-filter.svelte'
  import { uiStore } from '$lib/stores/ui.svelte'
  import type { ScheduleEntry } from '$lib/types/schedule'
  import { ChevronDown, TriangleAlert, X } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import { browser } from '$app/environment'

  const { data }: PageProps = $props()

  let selectedScheduleEntry = $state<ScheduleEntry | null>(null)

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

  // Disclaimer
  const scheduleDisclaimerExpanded = $derived(uiStore.scheduleDisclaimerExpanded)
  const disclaimerLinkClass =
    'font-medium underline underline-offset-2 transition-colors hover:text-amber-950 dark:hover:text-amber-100'
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <!-- Disclaimer -->
  <!-- Browser check is necessary to avoid hydration errors -->
  {#if browser}
    <div
      class="max-w-2xl overflow-hidden rounded-xl border border-amber-500/40 bg-linear-to-br from-amber-500/12 via-amber-500/8 to-amber-600/6 shadow-sm ring-1 ring-amber-500/20 dark:border-amber-400/50 dark:from-amber-400/10 dark:via-amber-400/6 dark:to-amber-500/5 dark:ring-amber-400/25"
    >
      <div class="p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <TriangleAlert
              class="size-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <div
              class="text-sm leading-snug font-semibold text-amber-950 dark:text-amber-100"
              id="schedule-disclaimer-title"
            >
              Neuer Kalender in Entwicklung - Feedback erwünscht!
            </div>
          </div>
          <button
            type="button"
            class="flex size-9 shrink-0 items-center justify-center rounded-lg text-amber-700 transition-colors hover:bg-amber-500/25 focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:outline-none dark:text-amber-300 dark:hover:bg-amber-400/20 dark:focus-visible:ring-amber-400/50"
            aria-expanded={scheduleDisclaimerExpanded}
            aria-controls="schedule-disclaimer-body"
            aria-label={scheduleDisclaimerExpanded ? 'Hinweis einklappen' : 'Hinweis ausklappen'}
            onclick={() => (uiStore.scheduleDisclaimerExpanded = !scheduleDisclaimerExpanded)}
          >
            {#if scheduleDisclaimerExpanded}
              <X class="size-[18px]" aria-hidden="true" />
            {:else}
              <ChevronDown class="size-[18px]" aria-hidden="true" />
            {/if}
          </button>
        </div>
        <!-- Grid row 0fr/1fr: child needs min-h-0 + overflow-hidden for height animation -->
        <div
          class="grid overflow-hidden transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style:grid-template-rows={scheduleDisclaimerExpanded ? '1fr' : '0fr'}
        >
          <div
            id="schedule-disclaimer-body"
            class="min-h-0 space-y-2 overflow-hidden pt-2 pl-8 text-sm text-amber-800 dark:text-amber-300"
            inert={!scheduleDisclaimerExpanded}
          >
            <p>
              Dies ist die neue Implementierung des Stundenplans. Da sich das Feature noch in
              aktiver Entwicklung befindet, können die angezeigten Daten fehlerhaft sein. Der
              offizielle Stundenplan bleibt weiterhin im
              <a
                href="https://hops.gm.th-koeln.de/hops/modules/timetable"
                target="_blank"
                rel="noopener noreferrer"
                class={disclaimerLinkClass}
              >
                HOPS
              </a>
              verfügbar.
            </p>
            <p>
              Feedback und Fehlerberichte bitte an
              <a href="mailto:schedule-dev@gm.fh-koeln.de" class={disclaimerLinkClass}>
                schedule-dev@gm.fh-koeln.de
              </a>
              senden oder ein
              <a
                href="https://github.com/THK-ADV/modules/issues"
                target="_blank"
                rel="noopener noreferrer"
                class={disclaimerLinkClass}
              >
                GitHub Issue
              </a>
              erstellen.
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Kalender</h2>
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
    scheduleFetcher={fetchScheduleEntries}
  />

  {#if selectedScheduleEntry}
    <ScheduleEntryDetailsDialog
      onClose={() => (selectedScheduleEntry = null)}
      entry={selectedScheduleEntry}
      studyPrograms={scheduleFilter.studyProgramsWithSpecialization}
    />
  {/if}
</div>
