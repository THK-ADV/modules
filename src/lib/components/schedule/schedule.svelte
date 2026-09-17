<script lang="ts">
  import {
    Calendar,
    type CalendarEvent,
    type CalendarEventProps,
    type DateRangeInfo
  } from '$lib/calendar'
  import type { ScheduleProps } from '$lib/components/schedule/types'
  import { uiStore } from '$lib/stores/ui.svelte.js'
  import type { ScheduleEntry } from '$lib/types/schedule'
  import { isTeachingKind } from '$lib/types/booking'
  import { semesterIdOf } from '$lib/types/semester'

  const {
    holidays,
    holidaysMonth,
    semesterEntries,
    onEventClick,
    onDateSelect,
    onEventDrop,
    onEventCopy,
    onEventResize,
    scheduleFilter,
    scheduleEntries = $bindable([]),
    bookings = $bindable([]),
    bookingSemester,
    loadBookings,
    editableSource,
    bypassCache,
    loadScheduleEntries
  }: ScheduleProps = $props()

  let fetchedBookingSemesters = $state<string[]>([])

  function isBookingSemesterLoaded(semester: string) {
    return semester === bookingSemester || fetchedBookingSemesters.includes(semester)
  }

  const holidayEventsForView = $derived(
    uiStore.selectedCalendarView === 'dayGridMonth' ? holidaysMonth : holidays
  )

  // Single derived function that tracks source toggles and filters
  const filteredEvents = $derived.by(() => {
    const { showSemester, showSchedule, showCampus, showFaculty } = scheduleFilter
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

    if (showSchedule || showCampus || showFaculty) {
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
        for (const entry of scheduleEntries) {
          if (matchesScheduleFilter(entry.title, entry.extendedProps.raw)) {
            allEvents.push(entry)
          }
        }
      }

      const visible = { teaching: showSchedule, campus: showCampus, faculty: showFaculty }

      for (const entry of bookings) {
        const props = entry.extendedProps
        if (!visible[props.kind]) continue
        const matches = isTeachingKind(props)
          ? matchesScheduleFilter(entry.title, props.raw)
          : matchesRooms(props.raw.rooms)
        if (matches) allEvents.push(entry)
      }
    }

    return allEvents
  })

  // Bookings are preloaded for the current semester; only fetch again when the view leaves it.
  function loadBookingsForRange(info: DateRangeInfo) {
    if (!loadBookings) return
    // `end` is exclusive; a week may straddle two semesters.
    for (const semester of new Set([
      semesterIdOf(info.start),
      semesterIdOf(new Date(info.end.getTime() - 1))
    ])) {
      if (isBookingSemesterLoaded(semester)) continue
      fetchedBookingSemesters.push(semester)
      Promise.resolve()
        .then(() => loadBookings(semester))
        .then((events) => bookings.push(...events))
        .catch(() => {
          fetchedBookingSemesters = fetchedBookingSemesters.filter((s) => s !== semester)
        })
    }
  }

  // Fetch schedule entries when the date range changes
  async function onDateRangeSet(info: DateRangeInfo) {
    loadBookingsForRange(info)
    try {
      // FullCalendar calls `datesSet` synchronously during `calendar.render()` inside Svelte's
      // `onMount`; defer `.run()` so the remote query starts outside that reactive mount context.
      const entries = await Promise.resolve()
        .then(() =>
          loadScheduleEntries({
            start: info.start.getTime(),
            end: info.end.getTime(),
            bypassCache
          })
        )
        .catch(() => {
          return []
        })
      scheduleEntries.length = 0
      scheduleEntries.push(...entries)
    } catch {
      // network or parse error — leave current entries in place
    }
  }
</script>

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
