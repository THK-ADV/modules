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

function setStringToLocalStorage(key: string, value: string) {
  if (!browser) {
    return
  }
  localStorage.setItem(key, value)
}

function createUiStore() {
  let selectedCalendarView = $state(getSelectedCalendarView())
  let selectedCalendarDate = $state(getSelectedCalendarDate())

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
    }
  }
}

export const uiStore = createUiStore()
