import { fmtCourseType, type CourseType, type ScheduleEntry } from '$lib/types/schedule'
import type { EventContentArg } from '@fullcalendar/core/index.js'
import { EVENT_SOURCE_COLORS } from './types'

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
 * Course type color mappings for badge styling.
 * Solid backgrounds with white text for reliable contrast on teal event blocks
 * in both light and dark modes.
 */
const COURSE_TYPE_COLORS: Record<CourseType, string> = {
  lecture: 'bg-orange-500 text-white',
  lab: 'bg-emerald-600 text-white',
  exercise: 'bg-slate-600 text-white',
  seminar: 'bg-sky-600 text-white',
  tutorial: 'bg-violet-600 text-white'
}

/**
 * Create a distinctive badge for course type with color coding.
 * Uses solid backgrounds with white text for crisp contrast on teal event blocks.
 * @param courseType - The course type.
 * @param shortLabel - The short label to display in the badge.
 * @returns The badge as a string.
 */
function createCourseTypeBadge(courseType: CourseType, shortLabel: string): string {
  const styles = COURSE_TYPE_COLORS[courseType]
  return `<div class="inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 ${styles}"><span class="text-[0.65rem] font-bold uppercase tracking-wider">${shortLabel}</span></div>`
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

/**
 * Create a short time string from the default time string.
 */
function createTimeShort(time: string): string {
  const [start, end] = time.split(' - ')
  const [startHour, startMinute] = start.split(':')
  const [endHour, endMinute] = end.split(':')
  let timeShort = ''
  if (startMinute === '00') {
    timeShort = `${startHour}`
  } else {
    timeShort = `${startHour}:${startMinute}`
  }
  if (endMinute === '00') {
    timeShort = `${timeShort} - ${endHour}`
  } else {
    timeShort = `${timeShort} - ${endHour}:${endMinute}`
  }
  return timeShort
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
  // Only apply custom layout for schedule events, use default for others
  if (arg.event.extendedProps?.source !== 'schedule') {
    return true
  }

  const props: ScheduleEntry = arg.event.extendedProps.raw
  const durationMinutes = Math.round(
    (new Date(props.end).getTime() - new Date(props.start).getTime()) / (1000 * 60)
  )
  const titleLong = props.moduleTitle
  const titleShort = props.moduleAbbrev
  const location = props.rooms.map(({ abbrev }) => abbrev).join(', ')
  const courseTypeLong = fmtCourseType(props.courseType)
  const courseTypeShort = courseTypeLong.charAt(0)

  if (durationMinutes <= 90) {
    return {
      html: `
        <div class="event-content flex h-full flex-col dark:text-white">
          <!-- Full view -->
          <div class="event-size-full flex flex-col gap-1.5 p-1.5">
            <div class="flex min-w-0 items-start gap-1 mb-1">
              <div class="min-w-0 flex-1 overflow-hidden text-sm font-semibold leading-tight wrap-break-word [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                ${titleLong}
              </div>
              ${createCourseTypeBadge(props.courseType, courseTypeShort)}
            </div>
            ${createInfoRow(ICONS.mapPin, location)}
          </div>
          <!-- Compact view -->
          <div class="event-size-compact relative flex flex-col gap-1 p-1.5">
            <div class="flex min-w-0 items-start gap-1 mb-1">
              <div class="min-w-0 flex-1 overflow-hidden text-sm font-semibold leading-tight wrap-break-word [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                ${titleShort}
              </div>
              ${createCourseTypeBadge(props.courseType, courseTypeShort)}
            </div>
            ${createShortInfoRow(location)}
          </div>
          <!-- Minimum view - centered abbreviation for narrow stacked columns -->
          <div class="event-size-minimum grid h-full overflow-hidden m-1.5">
            <div class="max-h-full font-bold leading-none [writing-mode:vertical-lr] [text-orientation:mixed] flex items-center justify-center">
              <span>${titleShort}</span>
            </div>
          </div>
        </div>
      `
    }
  }

  const time = arg.timeText
  const timeShort = createTimeShort(time)
  const lecturerLong = props.lecturer.map(({ label }) => label).join(', ')
  const lecturerShort = props.lecturer
    .map(({ abbreviation }) => abbreviation.toUpperCase())
    .join(', ')

  return {
    html: `
      <div class="event-content flex h-full flex-col dark:text-white">
        <!-- Full view -->
        <div class="event-size-full flex flex-col gap-1.5 p-1.5">
          <div class="flex min-w-0 items-start gap-1.5 mb-1">
            <div class="min-w-0 flex-1 overflow-hidden text-sm font-semibold leading-tight wrap-break-word [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
              ${titleLong}
            </div>
            ${createCourseTypeBadge(props.courseType, courseTypeShort)}
          </div>
          ${createInfoRow(ICONS.clock, time)}
          ${createInfoRow(ICONS.mapPin, location)}
          ${createInfoRow(ICONS.user, lecturerLong)}
          ${createInfoRow(ICONS.book, courseTypeLong)}
        </div>
        <!-- Compact view -->
        <div class="event-size-compact relative flex flex-col gap-1 p-1.5">
          <div class="flex min-w-0 items-start gap-1 mb-1">
              <div class="min-w-0 flex-1 overflow-hidden text-sm font-semibold leading-tight wrap-break-word [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                ${titleShort}
              </div>
              ${createCourseTypeBadge(props.courseType, courseTypeShort)}
          </div>
          ${createShortInfoRow(timeShort)}
          ${createShortInfoRow(location)}
          ${createShortInfoRow(lecturerShort)}
        </div>
        <!-- Minimum view - centered abbreviation for narrow stacked columns -->
        <div class="event-size-minimum grid h-full overflow-hidden m-1.5">
          <div class="max-h-full font-bold leading-none [writing-mode:vertical-lr] [text-orientation:mixed] flex items-center justify-center">
            <span>${titleShort}</span>
          </div>
        </div>
      </div>
    `
  }
}

/**
 * Create one month-view schedule row with fixed-priority segments:
 * color dot -> time -> truncating title -> course-type badge.
 * Dot, time, and badge are non-shrinking; only the title truncates.
 */
function createMonthRow(
  title: string,
  time: string,
  color: string,
  badgeStyles: string,
  courseType: string
) {
  return `
<div class="flex h-full w-full min-w-0 items-center gap-0.5 overflow-hidden px-1.5 py-0.5 leading-[1.15]">
  <span
    class="inline-block size-1.5 shrink-0 rounded-full"
    style="background-color: ${color};"
  ></span>
  <span class="shrink-0 tabular-nums opacity-80">${time}</span>
  <span class="min-w-0 flex-1 truncate">${title}</span>
  <span
    class="ml-0.5 inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[0.65rem] uppercase leading-none ${badgeStyles}"
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
  // Only apply custom layout for schedule events, use default for others
  if (arg.event.extendedProps?.source !== 'schedule') {
    return true
  }

  const props: ScheduleEntry = arg.event.extendedProps.raw
  const time = arg.timeText
  const titleFull = props.moduleTitle
  const titleCompact = props.moduleAbbrev || props.moduleTitle
  const courseType = fmtCourseType(props.courseType).charAt(0)
  const badgeStyles = COURSE_TYPE_COLORS[props.courseType]
  const color = EVENT_SOURCE_COLORS.schedule

  const fullRow = createMonthRow(titleFull, time, color, badgeStyles, courseType)
  const compactRow = createMonthRow(titleCompact, time, color, badgeStyles, courseType)

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
