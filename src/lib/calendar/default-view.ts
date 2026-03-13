import type { CalendarView } from './types.js'

/**
 * Media query for mobile/small viewport.
 * Align with Tailwind md (768px) if you change breakpoints.
 */
function getMobileMedia(): string {
  return '(max-width: 767px)'
}

/**
 * Default calendar view based on viewport: day view on small screens, week view otherwise.
 * Safe for SSR (returns week view when `window` is undefined).
 */
export function getDefaultCalendarView(): CalendarView {
  if (typeof window === 'undefined') return 'timeGridWeek'
  return window.matchMedia(getMobileMedia()).matches ? 'timeGridDay' : 'timeGridWeek'
}
