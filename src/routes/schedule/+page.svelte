<script lang="ts">
  import { browser } from '$app/environment'
  import {
    Calendar,
    type CalendarApi,
    type CalendarEvent,
    type CalendarView,
    type EventClickInfo,
    type EventFetcher,
    type EventSource,
    type EventSourceConfig
  } from '$lib/calendar'
  import { scheduleFilter } from '$lib/store.svelte'
  import { FlaskConical } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ScheduleFilter from './(components)/schedule-filter.svelte'
  import { createFilteredFetcher } from '$lib/calendar/filter'
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'

  const { data }: PageProps = $props()

  let initialView = $derived((data.selectedCalendarView || 'timeGridWeek') as CalendarView)

  // svelte-ignore state_referenced_locally
  const holidays: CalendarEvent[] = data.holidays
  // svelte-ignore state_referenced_locally
  const semesterEntries: CalendarEvent[] = data.semesterEntries

  let calendarApi: CalendarApi | undefined = $state()

  let sourceEventCounts: Record<EventSource, number> = $state({
    holiday: 0,
    'semester-plan': 0,
    schedule: 0,
    exam: 0
  })

  // Fetcher for schedule entries - calls server-side API route
  const scheduleFetcher: EventFetcher = async ({ start, end }) => {
    const res = await fetch(`/schedule?start=${start.getTime()}&end=${end.getTime()}`)

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || err.error || 'Failed to fetch schedule')
    }

    return res.json()
  }

  const fetchSemesterEntries: EventFetcher = () => {
    return Promise.resolve(semesterEntries)
  }

  // Tracks sources toggles only (filters are read in closure, not here)
  const eventSources: EventSourceConfig[] = $derived.by(() => {
    const { showHolidays, showSemester, showSchedule } = scheduleFilter
    const sources: EventSourceConfig[] = []

    if (showHolidays) {
      sources.push({
        id: 'holiday',
        name: 'Feiertage',
        events: holidays
      })
    }

    if (showSemester) {
      sources.push({
        id: 'semester-plan',
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

    return sources
  })

  function sourceUpdated(sourceId: EventSource, eventCount: number) {
    sourceEventCounts[sourceId] = eventCount
  }

  function onEventClick(info: EventClickInfo) {
    if (info.event.extendedProps?.source !== 'schedule') {
      return
    }
    goto(resolve(`/modules/[id=uuid]`, { id: info.event.extendedProps.module }))
  }

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
    <ScheduleFilter {sourceEventCounts} />
    <div class="border-border bg-card min-h-0 flex-1 overflow-hidden rounded-lg border">
      <Calendar
        {eventSources}
        {initialView}
        bind:api={calendarApi}
        editable
        {sourceUpdated}
        {onEventClick}
      />
    </div>
  {:else}
    <div
      class="border-border bg-card flex min-h-96 flex-1 items-center justify-center rounded-lg border"
    >
      <p class="text-muted-foreground">Kalender wird geladen...</p>
    </div>
  {/if}
</div>
