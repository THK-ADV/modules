<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import {
    Calendar,
    type CalendarEvent,
    type CalendarEventProps,
    type CalendarView,
    type DateRangeInfo,
    type EventClickInfo,
    type HolidayEventProps,
    type ScheduleEventProps,
    type SemesterPlanEventProps
  } from '$lib/calendar'
  import { scheduleFilter } from '$lib/store.svelte'
  import { TriangleAlert } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ScheduleFilter from './(components)/schedule-filter.svelte'

  const { data }: PageProps = $props()

  const initialView = $derived((data.selectedCalendarView || 'timeGridWeek') as CalendarView)
  const initialDate = $derived(data.selectedCalendarDate || new Date().toISOString())

  // svelte-ignore state_referenced_locally
  const holidays: CalendarEvent<HolidayEventProps>[] = data.holidays
  // svelte-ignore state_referenced_locally
  const semesterEntries: CalendarEvent<SemesterPlanEventProps>[] = data.semesterEntries

  let scheduleEntries: CalendarEvent<ScheduleEventProps>[] = $state([])

  // Single derived function that tracks source toggles and filters
  const [filteredEvents, sourceEventCounts] = $derived.by(() => {
    const { showHolidays, showSemester, showSchedule } = scheduleFilter
    const allEvents: CalendarEvent<CalendarEventProps>[] = []

    const counts = {
      holiday: 0,
      'semester-plan': 0,
      schedule: 0,
      exam: 0
    }

    // Filter events inline as we collect them
    if (showHolidays) {
      // holidays are always shown
      allEvents.push(...holidays)
      counts.holiday = holidays.length
    }

    if (showSemester) {
      const { selectedTeachingUnits, selectedSemesters } = scheduleFilter

      for (const entry of semesterEntries) {
        const { teachingUnit, semesterIndex } = entry.extendedProps

        // Teaching units filter
        if (selectedTeachingUnits.length > 0 && teachingUnit !== null) {
          if (!selectedTeachingUnits.includes(teachingUnit)) {
            continue
          }
        }

        // Semesters filter
        if (selectedSemesters.length > 0 && semesterIndex !== null) {
          if (!selectedSemesters.some((s) => semesterIndex.includes(parseInt(s, 10)))) {
            continue
          }
        }

        allEvents.push(entry)
        counts['semester-plan']++
      }
    }

    if (showSchedule) {
      const {
        selectedTeachingUnits,
        selectedCourseTypes,
        selectedModules,
        selectedStudyPrograms,
        selectedSemesters,
        selectedIdentities,
        selectedRooms,
        selectedModuleTypes,
        searchString
      } = scheduleFilter

      for (const entry of scheduleEntries) {
        const { teachingUnits, courseType, module, moduleManagement, props, room } =
          entry.extendedProps

        // Free-text search is constrained to the title of the event
        if (searchString && !entry.title.toLowerCase().includes(searchString.toLowerCase())) {
          continue
        }

        // Teaching units filter
        if (selectedTeachingUnits.length > 0) {
          if (!selectedTeachingUnits.some((tu) => teachingUnits.includes(tu))) {
            continue
          }
        }

        // Course types filter
        if (selectedCourseTypes.length > 0) {
          if (!selectedCourseTypes.includes(courseType)) {
            continue
          }
        }

        // Modules filter
        if (selectedModules.length > 0) {
          if (!selectedModules.includes(module)) {
            continue
          }
        }

        // Study programs filter
        if (selectedStudyPrograms.length > 0) {
          if (!selectedStudyPrograms.some((po) => props.po.some((p) => p.po === po))) {
            continue
          }
        }

        // Semesters filter
        if (selectedSemesters.length > 0) {
          if (
            !selectedSemesters.some((s) =>
              props.po.some(({ recommendedSemester }) =>
                recommendedSemester.includes(parseInt(s, 10))
              )
            )
          ) {
            continue
          }
        }

        // Identities filter
        if (selectedIdentities.length > 0) {
          if (!selectedIdentities.some((id) => moduleManagement.some((m) => m.id === id))) {
            continue
          }
        }

        // Rooms filter
        if (selectedRooms.length > 0) {
          if (!selectedRooms.includes(room)) {
            continue
          }
        }

        // Module types filter
        if (selectedModuleTypes.length > 0) {
          // If both module types and study programs are selected, apply them in combination
          if (selectedStudyPrograms.length > 0) {
            const relevantPos = props.po.filter(({ po }) => selectedStudyPrograms.includes(po))
            if (
              !selectedModuleTypes.some((id) =>
                relevantPos.some(
                  ({ mandatory }) => (id === 'pm' && mandatory) || (id === 'wm' && !mandatory)
                )
              )
            ) {
              continue
            }
          } else {
            // Check module types across all study programs (in isolation)
            if (
              !selectedModuleTypes.some((id) =>
                props.po.some(
                  ({ mandatory }) => (id === 'pm' && mandatory) || (id === 'wm' && !mandatory)
                )
              )
            ) {
              continue
            }
          }
        }

        allEvents.push(entry)
        counts.schedule++
      }
    }

    return [allEvents, counts]
  })

  function onEventClick(info: EventClickInfo) {
    if (info.event.extendedProps?.source !== 'schedule') {
      return
    }
    goto(resolve(`/modules/[id=uuid]`, { id: info.event.extendedProps.module }))
  }

  // Fetch schedule entries when the date range changes
  async function onDateRangeSet(info: DateRangeInfo) {
    const res = await fetch(`/schedule?start=${info.start.getTime()}&end=${info.end.getTime()}`)

    if (!res.ok) {
      return
    }

    scheduleEntries = await res.json()
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

  <!-- Filters & Source Toggles -->
  <ScheduleFilter {sourceEventCounts} />

  <div class="border-border bg-card min-h-0 flex-1 overflow-hidden rounded-lg border">
    <Calendar events={filteredEvents} {initialView} {initialDate} {onEventClick} {onDateRangeSet} />
  </div>
</div>
