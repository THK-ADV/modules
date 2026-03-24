<script lang="ts">
  import {
    Calendar,
    type CalendarEvent,
    type CalendarEventProps,
    type DateRangeInfo,
    type ScheduleEventProps
  } from '$lib/calendar'
  import type { ScheduleProps } from '$lib/components/schedule/types'

  const {
    holidays,
    semesterEntries,
    onEventClick,
    onDateSelect,
    onEventDrop,
    onEventCopy,
    onEventResize,
    scheduleFilter,
    sourceEventCounts = $bindable(),
    scheduleEntries = $bindable([]),
    scheduleFetcher
  }: ScheduleProps = $props()

  // Single derived function that tracks source toggles and filters
  const [filteredEvents, _sourceEventCounts] = $derived.by(() => {
    const { showHolidays, showSemester, showSchedule } = scheduleFilter
    const allEvents: CalendarEvent<CalendarEventProps>[] = []

    const counts = {
      holiday: 0,
      semesterPlan: 0,
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
      const selectedSemesterNums = selectedSemesters.map((s) => parseInt(s, 10))

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
          if (!selectedSemesterNums.some((n) => semesterIndex.includes(n))) {
            continue
          }
        }

        allEvents.push(entry)
        counts.semesterPlan++
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

      const selectedSemesterNums = selectedSemesters.map((s) => parseInt(s, 10))
      const lowerSearch = searchString.toLowerCase()

      // Pattern: if an entry fails any active filter below, we `continue` and drop it; only entries
      // that never hit `continue` make it through to `allEvents.push(entry)` at the end of the loop.
      for (const entry of scheduleEntries) {
        // Free-text search is constrained to the title and abbreviation of the schedule entry
        if (
          searchString &&
          !entry.title.toLowerCase().includes(lowerSearch) &&
          !entry.extendedProps.raw.moduleAbbrev.toLowerCase().includes(lowerSearch)
        ) {
          continue
        }

        // Teaching units filter
        if (selectedTeachingUnits.length > 0) {
          if (
            !selectedTeachingUnits.some((tu) => entry.extendedProps.raw.teachingUnits.includes(tu))
          ) {
            continue
          }
        }

        // Course types filter
        if (selectedCourseTypes.length > 0) {
          if (!selectedCourseTypes.includes(entry.extendedProps.raw.courseType)) {
            continue
          }
        }

        // Modules filter
        if (selectedModules.length > 0) {
          if (!selectedModules.includes(entry.extendedProps.raw.module)) {
            continue
          }
        }

        // Study programs & semesters filter
        // If both are selected, both must match on the same PO entry.
        if (selectedStudyPrograms.length > 0 || selectedSemesters.length > 0) {
          const matchingPoEntries = entry.extendedProps.raw.props.po.filter(
            ({ po, recommendedSemester }) => {
              const matchesProgram =
                selectedStudyPrograms.length === 0 || selectedStudyPrograms.includes(po)
              const matchesSemester =
                selectedSemesters.length === 0 ||
                selectedSemesterNums.some((n) => recommendedSemester.includes(n))

              return matchesProgram && matchesSemester
            }
          )

          if (matchingPoEntries.length === 0) {
            continue
          }
        }

        // Identities filter
        if (selectedIdentities.length > 0) {
          if (
            !selectedIdentities.some((id) =>
              entry.extendedProps.raw.moduleManagement.some((m) => m.id === id)
            )
          ) {
            continue
          }
        }

        // Rooms filter
        if (selectedRooms.length > 0) {
          if (
            !selectedRooms.some((r) => entry.extendedProps.raw.rooms.some(({ id }) => id === r))
          ) {
            continue
          }
        }

        // Module types filter
        // If both module types and study programs are selected, both must match on the same PO entry.
        if (selectedModuleTypes.length > 0) {
          const matchingPoEntries = entry.extendedProps.raw.props.po.filter(({ po, mandatory }) => {
            const matchesProgram =
              selectedStudyPrograms.length === 0 || selectedStudyPrograms.includes(po)
            const matchesModuleType = selectedModuleTypes.some(
              (id) => (id === 'pm' && mandatory) || (id === 'wm' && !mandatory)
            )

            return matchesProgram && matchesModuleType
          })

          if (matchingPoEntries.length === 0) {
            continue
          }
        }

        allEvents.push(entry)
        counts.schedule++
      }
    }

    return [allEvents, counts]
  })

  // NOTE: this might be inefficient. Maybe we should use a different approach
  $effect(() => {
    const { schedule, semesterPlan, holiday, exam } = _sourceEventCounts
    sourceEventCounts.schedule = schedule
    sourceEventCounts.semesterPlan = semesterPlan
    sourceEventCounts.holiday = holiday
    sourceEventCounts.exam = exam
  })

  async function onDateRangeSet(info: DateRangeInfo) {
    try {
      const res = await scheduleFetcher(info)
      if (!res.ok) {
        return
      }
      const entries: CalendarEvent<ScheduleEventProps>[] = await res.json()
      scheduleEntries.length = 0
      scheduleEntries.push(...entries)
    } catch {
      // network or parse error — leave current entries in place
    }
  }
</script>

<!-- Calendar -->
<div class="border-border bg-card min-h-[60vh] rounded-lg border">
  <Calendar
    events={filteredEvents}
    {onEventClick}
    {onDateRangeSet}
    {onDateSelect}
    {onEventDrop}
    {onEventCopy}
    {onEventResize}
  />
</div>
