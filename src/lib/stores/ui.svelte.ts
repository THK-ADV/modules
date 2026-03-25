import { browser } from '$app/environment'
import { getDefaultCalendarView } from '$lib/calendar'

function getSelectedCalendarView() {
  if (!browser) {
    return 'timeGridWeek'
  }
  const value = localStorage.getItem('selectedCalendarView')
  if (value) {
    return value
  } else {
    return getDefaultCalendarView()
  }
}

function getSelectedCalendarDate() {
  if (!browser) {
    return new Date().toISOString()
  }
  const value = localStorage.getItem('selectedCalendarDate')
  if (value) {
    return value
  } else {
    return new Date().toISOString()
  }
}

function getScheduleDisclaimerExpanded() {
  if (!browser) {
    return true
  }
  const value = localStorage.getItem('schedule-disclaimer-expanded')
  if (value) {
    return value === 'true'
  }
  return true
}

function createUiStore() {
  let selectedCalendarView = $state(getSelectedCalendarView())
  let selectedCalendarDate = $state(getSelectedCalendarDate())
  let scheduleDisclaimerExpanded = $state(getScheduleDisclaimerExpanded())

  return {
    get selectedCalendarView() {
      return selectedCalendarView
    },
    set selectedCalendarView(view: string) {
      selectedCalendarView = view
      if (browser) {
        localStorage.setItem('selectedCalendarView', view)
      }
    },
    get selectedCalendarDate() {
      return selectedCalendarDate
    },
    set selectedCalendarDate(date: string) {
      selectedCalendarDate = date
      if (browser) {
        localStorage.setItem('selectedCalendarDate', date)
      }
    },
    get scheduleDisclaimerExpanded() {
      return scheduleDisclaimerExpanded
    },
    set scheduleDisclaimerExpanded(expanded: boolean) {
      scheduleDisclaimerExpanded = expanded
      if (browser) {
        localStorage.setItem('schedule-disclaimer-expanded', expanded.toString())
      }
    }
  }
}

export const uiStore = createUiStore()
