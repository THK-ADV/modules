import { browser } from '$app/environment'
import { getDefaultCalendarView } from '$lib/calendar'

function getSelectedCalendarView() {
  if (!browser) {
    return getDefaultCalendarView()
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

function createUiStore() {
  let selectedCalendarView = $state(getSelectedCalendarView())
  let selectedCalendarDate = $state(getSelectedCalendarDate())

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
    }
  }
}

export const uiStore = createUiStore()
