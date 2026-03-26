import { browser } from '$app/environment'
import { getDefaultCalendarView } from '$lib/calendar'

function getSelectedCalendarView() {
  if (!browser) {
    return 'timeGridWeek'
  }
  const value = localStorage.getItem('selected-calendar-view')
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
  const value = localStorage.getItem('selected-calendar-date')
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
  const value = localStorage.getItem('schedule-disclaimer-expanded-state')
  if (value) {
    return value === 'true'
  }
  return true
}

function setStringToLocalStorage(key: string, value: string) {
  if (!browser) {
    return
  }
  localStorage.setItem(key, value)
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
      setStringToLocalStorage('selected-calendar-view', view)
    },
    get selectedCalendarDate() {
      return selectedCalendarDate
    },
    set selectedCalendarDate(date: string) {
      selectedCalendarDate = date
      setStringToLocalStorage('selected-calendar-date', date)
    },
    get scheduleDisclaimerExpanded() {
      return scheduleDisclaimerExpanded
    },
    set scheduleDisclaimerExpanded(expanded: boolean) {
      scheduleDisclaimerExpanded = expanded
      setStringToLocalStorage('schedule-disclaimer-expanded-state', expanded.toString())
    }
  }
}

export const uiStore = createUiStore()
