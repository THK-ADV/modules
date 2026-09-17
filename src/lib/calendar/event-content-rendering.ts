import type { CampusBooking } from '$lib/types/booking'
import { fmtCourseType, type ScheduleEntry } from '$lib/types/schedule'
import type { EventContentArg } from '@fullcalendar/core/index.js'
import {
  BOOKING_KIND_COLORS,
  COURSE_TYPE_COLORS,
  isScheduleLike,
  type CalendarEventProps
} from './types'

/** Booking titles are user input and end up in `innerHTML`. */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Create an SVG icon from a path or an array of paths.
 * @param paths - The path or array of paths to create the icon from.
 * @returns The SVG icon as a string.
 */
function createIcon(paths: string | string[]): string {
  const pathArray = Array.isArray(paths) ? paths : [paths]
  const pathElements = pathArray
    .map(
      (path) =>
        `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"></path>`
    )
    .join('')
  return `<svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${pathElements}</svg>`
}

/**
 * Create an info row with muted styling for better visual hierarchy.
 * @param icon - The icon to display.
 * @param text - The text to display.
 * @returns The info row as a string.
 */
function createInfoRow(icon: string, text: string): string {
  return `<div class="flex items-center gap-1.5 text-xs opacity-70">${icon}<span class="truncate">${text}</span></div>`
}

function createShortInfoRow(text: string): string {
  return `<div class="flex items-center gap-1.5 text-xs opacity-70"><span class="truncate">${text}</span></div>`
}

/** Two-line clamped event title for the full and compact week-view variants. */
function createTitle(title: string): string {
  return `<div class="min-w-0 overflow-hidden text-sm font-semibold leading-tight wrap-break-word [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] mb-1">${title}</div>`
}

/**
 * Wrap the week-view size variants (`event-size-full`, `event-size-compact`, `event-size-minimum`)
 * into the event container. The minimum variant shows only a vertically written title.
 */
function wrapWeekViews(color: string, full: string, compact: string, minimumTitle: string) {
  return {
    html: `
      <div class="event-content flex h-full flex-col pl-2 text-white" style="--event-course-color: ${color};">
        <div class="event-size-full flex flex-col gap-1.5 p-1.5">${full}</div>
        <div class="event-size-compact relative flex flex-col gap-1 p-1.5">${compact}</div>
        <div class="event-size-minimum flex h-full items-center justify-center overflow-hidden m-1.5">
          <span class="max-h-full font-bold leading-none [writing-mode:vertical-lr] [text-orientation:mixed]">${minimumTitle}</span>
        </div>
      </div>
    `
  }
}

/**
 * Create a short time string from the default time string.
 */
function createTimeShort(time: string): string {
  const [start, end] = time.split(' - ')
  const [startHour, startMinute] = start.split(':')
  const [endHour, endMinute] = end.split(':')
  const startShort = startMinute === '00' ? startHour : `${startHour}:${startMinute}`
  const endShort = endMinute === '00' ? endHour : `${endHour}:${endMinute}`
  return `${startShort} - ${endShort}`
}

/**
 * The icons to use for the event content.
 */
const ICONS: Record<string, string> = {
  clock: createIcon('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'),
  mapPin: createIcon([
    'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
    'M15 11a3 3 0 11-6 0 3 3 0 016 0z'
  ]),
  user: createIcon(['M16 7a4 4 0 11-8 0 4 4 0 018 0z', 'M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z']),
  book: createIcon(
    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  )
}

/**
 * Render rich schedule entries for time-grid views (week/day).
 * Uses responsive variants (`event-size-full`, `event-size-compact`, `event-size-minimum`)
 * to show full details in larger slots and progressively condensed content in small slots.
 * @param arg - The event content argument.
 * @returns The event content as a string.
 */
export function renderWeekViewEventContent(arg: EventContentArg) {
  const eventProps = arg.event.extendedProps as CalendarEventProps
  if (isScheduleLike(eventProps)) {
    return renderWeekViewScheduleLikeContent(arg, eventProps.raw)
  }
  if (eventProps.source === 'booking') {
    return renderWeekViewBookingContent(arg, eventProps.raw)
  }
  return true
}

function renderWeekViewScheduleLikeContent(arg: EventContentArg, props: ScheduleEntry) {
  const durationMinutes = Math.round(
    (new Date(props.end).getTime() - new Date(props.start).getTime()) / (1000 * 60)
  )
  // Schedule entries carry the module title, teaching bookings their booking title.
  const titleLong = escapeHtml(arg.event.title)
  const titleShort = props.moduleAbbrev
  const location = props.rooms
    .map(({ abbrev }) => abbrev)
    .sort()
    .join(', ')
  const courseTypeLong = fmtCourseType(props.courseType)
  const courseTypeColor = COURSE_TYPE_COLORS[props.courseType]

  if (durationMinutes <= 90) {
    return wrapWeekViews(
      courseTypeColor,
      createTitle(titleLong) + createInfoRow(ICONS.mapPin, location),
      createTitle(titleShort) + createShortInfoRow(location),
      titleShort
    )
  }

  const time = arg.timeText
  const timeShort = createTimeShort(time)
  const lecturerLong = props.lecturer
    .map(({ label }) => label)
    .sort()
    .join(', ')
  const lecturerShort = props.lecturer
    .map(({ abbreviation }) => abbreviation.toUpperCase())
    .sort()
    .join(', ')

  return wrapWeekViews(
    courseTypeColor,
    createTitle(titleLong) +
      createInfoRow(ICONS.clock, time) +
      createInfoRow(ICONS.mapPin, location) +
      createInfoRow(ICONS.user, lecturerLong) +
      createInfoRow(ICONS.book, courseTypeLong),
    createTitle(titleShort) +
      createShortInfoRow(timeShort) +
      createShortInfoRow(location) +
      createShortInfoRow(lecturerShort),
    titleShort
  )
}

/**
 * Render campus and faculty bookings for time-grid views: title, time, rooms, contact persons.
 */
function renderWeekViewBookingContent(arg: EventContentArg, booking: CampusBooking) {
  const color = BOOKING_KIND_COLORS[booking.kind]
  const title = escapeHtml(booking.title)
  const location = booking.rooms
    .map(({ abbrev }) => abbrev)
    .sort()
    .join(', ')
  const contacts = booking.lecturer
    .map(({ label }) => label)
    .sort()
    .join(', ')
  const durationMinutes = Math.round(
    (new Date(booking.end).getTime() - new Date(booking.start).getTime()) / (1000 * 60)
  )
  const details =
    durationMinutes <= 90
      ? createInfoRow(ICONS.mapPin, location)
      : createInfoRow(ICONS.clock, arg.timeText) +
        createInfoRow(ICONS.mapPin, location) +
        createInfoRow(ICONS.user, contacts)

  return wrapWeekViews(
    color,
    createTitle(title) + details,
    createTitle(title) + createShortInfoRow(location),
    title
  )
}

/**
 * Create one month-view schedule row with fixed-priority segments:
 * color dot -> time -> truncating title -> course-type badge.
 * Dot, time, and badge are non-shrinking; only the title truncates.
 */
function createMonthRow(title: string, time: string, color: string, courseType: string) {
  return `
<div class="flex h-full w-full min-w-0 items-center gap-0.5 overflow-hidden px-1.5 py-0.5 leading-[1.15]">
  <span
    class="inline-block size-1.5 shrink-0 rounded-full"
    style="background-color: ${color};"
  ></span>
  <span class="shrink-0 tabular-nums opacity-80">${time}</span>
  <span class="min-w-0 flex-1 truncate">${title}</span>
  <span
    class="ml-0.5 inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold uppercase leading-none tracking-wider"
    style="background-color: ${color}; color: #fff;"
  >
    ${courseType}
  </span>
</div>
`
}

/**
 * Render month-view schedule entries with full and compact title variants.
 * IMPORTANT: Keep this renderer in sync with the month-view CSS in `src/app.css`
 * (`.fc-dayGridMonth-view .fc-daygrid-dot-event*`, `.event-content-size-container`,
 * and `.event-size-*` container-query rules). If layout/markup/spacing changes here,
 * update those CSS selectors and spacing rules as well.
 * @param arg - The event content argument.
 * @returns The event content as a string.
 */
export function renderMonthViewEventContent(arg: EventContentArg) {
  const eventProps = arg.event.extendedProps as CalendarEventProps
  const time = arg.timeText

  if (isScheduleLike(eventProps)) {
    const props = eventProps.raw
    const titleFull = escapeHtml(arg.event.title)
    const titleCompact = props.moduleAbbrev || titleFull
    const courseType = fmtCourseType(props.courseType).charAt(0)
    const color = COURSE_TYPE_COLORS[props.courseType]
    return wrapMonthRows(
      createMonthRow(titleFull, time, color, courseType),
      createMonthRow(titleCompact, time, color, courseType)
    )
  }
  if (eventProps.source === 'booking') {
    const title = escapeHtml(eventProps.raw.title)
    const row = createMonthRow(
      title,
      time,
      BOOKING_KIND_COLORS[eventProps.kind],
      eventProps.kind === 'campus' ? 'C' : 'F'
    )
    return wrapMonthRows(row, row)
  }
  return true
}

function wrapMonthRows(fullRow: string, compactRow: string) {
  return {
    html: `
      <div class="event-content event-content-size-container flex h-full w-full min-w-0 flex-col overflow-hidden text-xs text-slate-900 dark:text-white">
        <div class="event-size-full w-full min-w-0 overflow-hidden">
          ${fullRow}
        </div>
        <div class="event-size-compact w-full min-w-0 overflow-hidden">
          ${compactRow}
        </div>
        <div class="event-size-minimum w-full min-w-0 overflow-hidden">
          ${compactRow}
        </div>
      </div>
    `
  }
}
