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

// Short names of the calendar views in shared links.
const sharedViews = new Map([
  ['day', 'timeGridDay'],
  ['week', 'timeGridWeek'],
  ['month', 'dayGridMonth']
])

function createUiStore() {
  let selectedCalendarView = $state(getSelectedCalendarView())
  let selectedCalendarDate = $state(getSelectedCalendarDate())
  // A shared link shows its view and date without overwriting the viewer's own.
  let shared = false

  return {
    get selectedCalendarView() {
      return selectedCalendarView
    },
    set selectedCalendarView(view: string) {
      selectedCalendarView = view
      if (!shared) setStringToLocalStorage('selected-calendar-view', view)
    },
    get selectedCalendarDate() {
      return selectedCalendarDate
    },
    set selectedCalendarDate(date: string) {
      selectedCalendarDate = date
      if (!shared) setStringToLocalStorage('selected-calendar-date', date)
    },
    get shareParams() {
      return {
        view: [...sharedViews].find(([, view]) => view === selectedCalendarView)?.[0] ?? '',
        // Local day as YYYY-MM-DD; the ISO string is UTC and may fall on the previous day.
        date: new Date(selectedCalendarDate).toLocaleDateString('sv-SE')
      }
    },
    /** Shows the view and date of a shared link, or restores the viewer's own on `null`. */
    applyShare(params: URLSearchParams | null) {
      shared = params !== null
      const date = params?.get('date') ?? ''
      selectedCalendarView = sharedViews.get(params?.get('view') ?? '') ?? getSelectedCalendarView()
      selectedCalendarDate = Number.isNaN(Date.parse(date)) ? getSelectedCalendarDate() : date
    }
  }
}

export const uiStore = createUiStore()
