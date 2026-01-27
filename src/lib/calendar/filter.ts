import { scheduleFilter } from '$lib/store.svelte'
import type { CalendarEvent, EventFetcher } from './types'

function shouldShowEvent(event: CalendarEvent): boolean {
  const props = event.extendedProps
  if (!props) return true

  const source = props.source

  // Fast path: always show these event types
  if (source === 'holiday' || source === 'exam') return true

  const {
    selectedTeachingUnits,
    selectedCourseTypes,
    selectedModules,
    selectedStudyPrograms,
    selectedSemesters,
    selectedIdentities,
    selectedRooms,
    selectedModuleTypes
  } = scheduleFilter

  // Teaching units filter
  if (selectedTeachingUnits.length > 0) {
    if (source === 'semester-plan') {
      // For semester-plan, check single teachingUnit
      if (props.teachingUnit === null) return true
      if (!selectedTeachingUnits.includes(props.teachingUnit)) return false
    } else if (source === 'schedule') {
      // For schedule, check if any teachingUnit matches
      const teachingUnits = props.teachingUnits
      if (!teachingUnits.some((tu) => selectedTeachingUnits.includes(tu))) return false
    }
  }

  // Course types filter
  if (selectedCourseTypes.length > 0) {
    if (source === 'schedule') {
      if (!selectedCourseTypes.includes(props.courseType)) return false
    }
  }

  // Modules filter
  if (selectedModules.length > 0) {
    if (source === 'schedule') {
      if (!selectedModules.includes(props.module)) return false
    }
  }

  // Study programs filter
  if (selectedStudyPrograms.length > 0) {
    if (source === 'schedule') {
      const pos = props.props.po
      if (!pos.some(({ po }) => selectedStudyPrograms.includes(po))) return false
    }
  }

  // Semesters filter
  if (selectedSemesters.length > 0) {
    if (source === 'schedule') {
      const semesterIndex = props.props.po.flatMap(({ recommendedSemester }) => recommendedSemester)
      if (!selectedSemesters.some((s) => semesterIndex.includes(parseInt(s, 10)))) return false
    } else if (source === 'semester-plan' && props.semesterIndex !== null) {
      if (!selectedSemesters.some((s) => props.semesterIndex!.includes(parseInt(s, 10))))
        return false
    }
  }

  // Identities filter
  if (selectedIdentities.length > 0) {
    if (source === 'schedule') {
      if (!selectedIdentities.some((id) => props.moduleManagement.some((m) => m.id === id)))
        return false
    }
  }

  // Rooms filter
  if (selectedRooms.length > 0) {
    if (source === 'schedule') {
      if (!selectedRooms.includes(props.room)) return false
    }
  }

  // Module types filter
  if (selectedModuleTypes.length > 0) {
    if (source === 'schedule') {
      // If both module types and study programs are selected, apply them in combination
      if (selectedStudyPrograms.length > 0) {
        // Only check module types within the selected study programs
        const relevantPos = props.props.po.filter((a) => selectedStudyPrograms.includes(a.po))
        if (
          !selectedModuleTypes.some((id) =>
            relevantPos.some((a) => (id === 'pm' && a.mandatory) || (id === 'wm' && !a.mandatory))
          )
        )
          return false
      } else {
        // Check module types across all study programs (in isolation)
        if (
          !selectedModuleTypes.some((id) =>
            props.props.po.some(
              (a) => (id === 'pm' && a.mandatory) || (id === 'wm' && !a.mandatory)
            )
          )
        )
          return false
      }
    }
  }

  return true
}

// Called at fetch time, reads current filter values from closure
export function filterEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (!scheduleFilter.hasActiveFilters()) {
    return events
  }
  return events.filter((event) => shouldShowEvent(event))
}

export function createFilteredFetcher(baseFetcher: EventFetcher): EventFetcher {
  return async (info) => {
    const events = await baseFetcher(info)
    return filterEvents(events)
  }
}
