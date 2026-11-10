<script lang="ts">
  import {
    Calendar,
    type CalendarEvent,
    type CalendarEventProps,
    type DateRangeInfo
  } from '$lib/calendar'
  import type { ScheduleProps } from '$lib/components/schedule/types'
  import { Button } from '$lib/components/ui/button/index.js'
  import { getErrorMessage } from '$lib/errors'
  import type { PublishedExamEntry } from '$lib/schemas/exam-planning'
  import { uiStore } from '$lib/stores/ui.svelte.js'
  import type { ScheduleEntry } from '$lib/types/schedule'
  import { isTeachingKind } from '$lib/types/booking'
  import { RefreshCw, TriangleAlert } from '@lucide/svelte'

  const {
    holidays,
    holidaysMonth,
    semesterEntries,
    sources,
    onEventClick,
    onDateSelect,
    onEventDrop,
    onEventCopy,
    onEventResize,
    scheduleFilter,
    editableSource
  }: ScheduleProps = $props()

  const holidayEventsForView = $derived(
    uiStore.selectedCalendarView === 'dayGridMonth' ? holidaysMonth : holidays
  )

  // Single derived function that tracks source toggles and filters
  const filteredEvents = $derived.by(() => {
    const { showSemester, showSchedule, showCampus, showFaculty, showExams } = scheduleFilter
    const allEvents: CalendarEvent<CalendarEventProps>[] = [...holidayEventsForView]

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
      }
    }

    if (showSchedule || showCampus || showFaculty || showExams) {
      const {
        selectedTeachingUnits,
        selectedCourseTypes,
        selectedModules,
        selectedStudyPrograms,
        selectedSemesters,
        selectedLecturers,
        selectedModuleManagers,
        showModuleManagementFilter,
        selectedRooms,
        selectedModuleTypes,
        searchString
      } = scheduleFilter

      const selectedSemesterNums = selectedSemesters.map((s) => parseInt(s, 10))
      const lowerSearch = searchString.toLowerCase()

      const matchesRooms = (rooms: { id: string }[]) =>
        selectedRooms.length === 0 || selectedRooms.some((r) => rooms.some(({ id }) => id === r))

      // Applies to schedule entries and teaching bookings alike. `title` is the module title for
      // schedule entries and the booking title for bookings.
      const matchesScheduleFilter = (title: string, raw: ScheduleEntry): boolean => {
        // Free-text search is constrained to the title and abbreviation of the entry
        if (
          searchString &&
          !title.toLowerCase().includes(lowerSearch) &&
          !raw.moduleAbbrev.toLowerCase().includes(lowerSearch)
        ) {
          return false
        }

        // Teaching units filter
        if (selectedTeachingUnits.length > 0) {
          if (!selectedTeachingUnits.some((tu) => raw.teachingUnits.includes(tu))) {
            return false
          }
        }

        // Course types filter
        if (selectedCourseTypes.length > 0 && !selectedCourseTypes.includes(raw.courseType)) {
          return false
        }

        // Modules filter
        if (selectedModules.length > 0 && !selectedModules.includes(raw.module)) {
          return false
        }

        // Study programs & semesters filter
        // If both are selected, both must match on the same PO entry.
        if (selectedStudyPrograms.length > 0 || selectedSemesters.length > 0) {
          const hasMatchingPo = raw.po.some(({ po, recommendedSemester }) => {
            const matchesProgram =
              selectedStudyPrograms.length === 0 || selectedStudyPrograms.includes(po)
            const matchesSemester =
              selectedSemesters.length === 0 ||
              selectedSemesterNums.some((n) => recommendedSemester.includes(n))

            return matchesProgram && matchesSemester
          })

          if (!hasMatchingPo) {
            return false
          }
        }

        // Module managers filter
        if (showModuleManagementFilter && selectedModuleManagers.length > 0) {
          if (!selectedModuleManagers.some((id) => raw.moduleManagement.some((m) => m.id === id))) {
            return false
          }
        }

        // Lecturers filter
        if (selectedLecturers.length > 0) {
          if (!selectedLecturers.some((id) => raw.lecturer.some((m) => m.id === id))) {
            return false
          }
        }

        // Rooms filter
        if (!matchesRooms(raw.rooms)) {
          return false
        }

        // Module types filter
        // If both module types and study programs are selected, both must match on the same PO entry.
        if (selectedModuleTypes.length > 0) {
          const hasMatchingPo = raw.po.some(({ po, mandatory }) => {
            const matchesProgram =
              selectedStudyPrograms.length === 0 || selectedStudyPrograms.includes(po)
            const matchesModuleType = selectedModuleTypes.some(
              (id) => (id === 'pm' && mandatory) || (id === 'wm' && !mandatory)
            )

            return matchesProgram && matchesModuleType
          })

          if (!hasMatchingPo) {
            return false
          }
        }

        return true
      }

      if (showSchedule) {
        for (const entry of sources.scheduleEntries?.current ?? []) {
          if (matchesScheduleFilter(entry.title, entry.extendedProps.raw)) {
            allEvents.push(entry)
          }
        }
      }

      // Exams have no course type or module management, so these filters do not apply to them.
      // Lecturers match the first examiners of the modules, not the invigilators.
      const matchesExamFilter = (title: string, raw: PublishedExamEntry): boolean =>
        (!searchString ||
          title.toLowerCase().includes(lowerSearch) ||
          raw.modules.some(
            (m) =>
              m.title.toLowerCase().includes(lowerSearch) ||
              m.abbrev.toLowerCase().includes(lowerSearch)
          )) &&
        (selectedTeachingUnits.length === 0 ||
          selectedTeachingUnits.some((tu) => raw.teachingUnits.includes(tu))) &&
        (selectedModules.length === 0 || raw.modules.some((m) => selectedModules.includes(m.id))) &&
        (selectedLecturers.length === 0 ||
          selectedLecturers.some((id) => raw.modules.some((m) => m.firstExaminer?.id === id))) &&
        matchesRooms(raw.rooms) &&
        ((selectedStudyPrograms.length === 0 &&
          selectedSemesters.length === 0 &&
          selectedModuleTypes.length === 0) ||
          raw.po.some(
            ({ po, recommendedSemester, mandatory }) =>
              (selectedStudyPrograms.length === 0 || selectedStudyPrograms.includes(po)) &&
              (selectedSemesters.length === 0 ||
                selectedSemesterNums.some((n) => recommendedSemester.includes(n))) &&
              (selectedModuleTypes.length === 0 ||
                selectedModuleTypes.some(
                  (id) => (id === 'pm' && mandatory) || (id === 'wm' && !mandatory)
                ))
          ))

      if (showExams) {
        for (const entry of sources.examEntries?.current ?? []) {
          if (matchesExamFilter(entry.title, entry.extendedProps.raw)) allEvents.push(entry)
        }
      }

      const visible = { teaching: showSchedule, campus: showCampus, faculty: showFaculty }

      for (const query of sources.bookings) {
        for (const entry of query.current ?? []) {
          const props = entry.extendedProps
          if (!visible[props.kind]) continue
          const matches = isTeachingKind(props)
            ? matchesScheduleFilter(entry.title, props.raw)
            : matchesRooms(props.raw.rooms)
          if (matches) allEvents.push(entry)
        }
      }
    }

    return allEvents
  })

  function onDateRangeSet({ start, end }: DateRangeInfo) {
    const range = sources.range
    if (range?.start !== start.getTime() || range.end !== end.getTime()) {
      sources.range = { start: start.getTime(), end: end.getTime() }
    }
  }
</script>

{#if sources.failed.length}
  <div
    class="border-destructive/30 bg-destructive/10 mb-2 flex flex-wrap items-center gap-2 rounded-md border p-2 pl-3 text-sm"
    role="alert"
  >
    <TriangleAlert class="text-destructive size-4 shrink-0" aria-hidden="true" />
    <p class="text-destructive flex-1">
      Einträge fehlen im Kalender: {getErrorMessage(sources.failed[0]?.error)}
    </p>
    <Button variant="outline" size="sm" onclick={() => sources.retry()}>
      <RefreshCw aria-hidden="true" />
      Erneut laden
    </Button>
  </div>
{/if}

<!-- Calendar -->
<div class="min-h-[60vh]">
  <Calendar
    events={filteredEvents}
    {onEventClick}
    {onDateRangeSet}
    {onDateSelect}
    {onEventDrop}
    {onEventCopy}
    {onEventResize}
    {editableSource}
  />
</div>
