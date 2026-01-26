<script lang="ts">
  import { browser } from '$app/environment'
  import {
    Calendar,
    type CalendarApi,
    type CalendarEvent,
    type CalendarView,
    type EventFetcher,
    type EventSourceConfig
  } from '$lib/calendar'
  import { scheduleFilter } from '$lib/store.svelte'
  import { FlaskConical } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ScheduleFilter from './(components)/schedule-filter.svelte'

  const { data }: PageProps = $props()

  let initialView = $derived((data.selectedCalendarView || 'timeGridWeek') as CalendarView)

  // svelte-ignore state_referenced_locally
  const holidays: CalendarEvent[] = data.holidays
  // svelte-ignore state_referenced_locally
  const semesterEntries: CalendarEvent[] = data.semesterEntries

  let calendarApi: CalendarApi | undefined = $state()

  // Fetcher for schedule entries - calls server-side API route
  const scheduleFetcher: EventFetcher = async ({ start, end }) => {
    const res = await fetch(`/schedule?start=${start.getTime()}&end=${end.getTime()}`)

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || err.error || 'Failed to fetch schedule')
    }

    return res.json()
  }

  const fetchExams: EventFetcher = () => {
    return Promise.resolve([
      {
        id: 'exam-1',
        title: 'Klausur: Mathematik I',
        start: '2026-02-05T09:00:00',
        end: '2026-02-05T11:00:00',
        backgroundColor: '#cd853f', // muted peru orange from autumn palette - softer than bright orange
        extendedProps: {
          source: 'exam'
        }
      }
    ])
  }

  const fetchSemesterEntries: EventFetcher = () => {
    return Promise.resolve(semesterEntries)
  }

  // Called at fetch time, reads current filter values from closure
  function filterEvents(events: CalendarEvent[]): CalendarEvent[] {
    return events.filter((event) => {
      const props = event.extendedProps
      if (!props) return true

      switch (props.source) {
        case 'holiday':
          return true
        case 'semester-plan': {
          const tus = scheduleFilter.selectedTeachingUnits
          if (tus.length === 0) return true
          if (props.teachingUnit === null) return true
          return tus.includes(props.teachingUnit)
        }
        case 'exam':
          return true
        case 'schedule': {
          const tus = scheduleFilter.selectedTeachingUnits
          if (tus.length === 0) return true
          return props.teachingUnits.some((tu) => tus.includes(tu))
        }
      }
    })
  }

  function createFilteredFetcher(baseFetcher: EventFetcher): EventFetcher {
    return async (info) => {
      const events = await baseFetcher(info)
      return filterEvents(events)
    }
  }

  // Tracks sources toggles only (filters are read in closure, not here)
  const eventSources: EventSourceConfig[] = $derived.by(() => {
    const { showHolidays, showSemester, showSchedule, showExams } = scheduleFilter
    const sources: EventSourceConfig[] = []

    if (showHolidays) {
      sources.push({
        id: 'holidays',
        name: 'Feiertage',
        events: holidays
      })
    }

    if (showSemester) {
      sources.push({
        id: 'semester',
        name: 'Semesterzeiten',
        fetcher: createFilteredFetcher(fetchSemesterEntries)
      })
    }

    if (showSchedule) {
      sources.push({
        id: 'schedule',
        name: 'Stundenplan',
        fetcher: createFilteredFetcher(scheduleFetcher)
      })
    }

    if (showExams) {
      sources.push({
        id: 'exams',
        name: 'Prüfungen',
        fetcher: createFilteredFetcher(fetchExams)
      })
    }

    return sources
  })

  // Filters aren't tracked by $derived above, so we need this to trigger refetch
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    scheduleFilter._
    calendarApi?.refetchEvents()
  })
</script>

<div class="flex h-full flex-1 flex-col space-y-4">
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <FlaskConical class="size-6" />
      <h2 class="text-3xl font-bold tracking-tight">Kalender (Experimentell)</h2>
    </div>
    <p class="text-muted-foreground text-sm">
      Kalender mit Einträgen zum Stundenplan, Prüfungen, Semesterplan und Feiertagen.
    </p>
  </div>

  <!-- Calendar -->
  {#if browser}
    <!-- Filters & Source Toggles -->
    <ScheduleFilter />
    <div class="border-border bg-card min-h-0 flex-1 overflow-hidden rounded-lg border">
      <Calendar {eventSources} {initialView} bind:api={calendarApi} editable />
    </div>
  {:else}
    <div
      class="border-border bg-card flex min-h-96 flex-1 items-center justify-center rounded-lg border"
    >
      <p class="text-muted-foreground">Kalender wird geladen...</p>
    </div>
  {/if}
</div>
