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
  return `<div class="absolute right-2 top-2 flex items-center justify-center rounded-md px-2 py-0.5 shadow-md ${styles}"><span class="text-[0.65rem] font-bold uppercase tracking-wider">${shortLabel}</span></div>`
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
 * Render the event content for schedule events.
 * @param arg - The event content argument.
 * @returns The event content as a string.
 */
export function renderWeekViewEventContent(arg: EventContentArg) {
  // Only apply custom layout for schedule events, use default for others
  if (arg.event.extendedProps?.source !== 'schedule') {
    return true
  }

  const props: ScheduleEntry = arg.event.extendedProps.raw
  const time = arg.timeText

  // Long versions
  const titleLong = props.moduleTitle
  const lecturerLong = props.moduleManagement.map(({ label }) => label).join(', ')
  const courseTypeLong = fmtCourseType(props.courseType)

  // Short versions
  const titleShort = props.moduleAbbrev
  const lecturerShort = props.moduleManagement
    .map(({ abbreviation }) => abbreviation.toUpperCase())
    .join(', ')
  const courseTypeShort = courseTypeLong.charAt(0)

  // Always the same
  const location = props.rooms.map(({ abbrev }) => abbrev).join(', ')

  return {
    html: `
      <div class="event-content flex h-full flex-col dark:text-white">
        <!-- Full view -->
        <div class="event-size-full relative flex flex-col gap-1.5 p-2">
          ${createCourseTypeBadge(props.courseType, courseTypeShort)}
          <div class="text-sm font-semibold leading-tight pr-12">${titleLong}</div>
          ${createInfoRow(ICONS.clock, time)}
          ${createInfoRow(ICONS.mapPin, location)}
          ${createInfoRow(ICONS.user, lecturerLong)}
          ${createInfoRow(ICONS.book, courseTypeLong)}
        </div>
        <!-- Compact view -->
        <div class="event-size-compact flex flex-col gap-1 p-1.5">
          <div class="text-sm font-semibold leading-tight">${titleShort}</div>
          ${createShortInfoRow(location)}
          ${createShortInfoRow(lecturerShort)}
          ${createShortInfoRow(courseTypeShort)}
        </div>
        <!-- Minimum view - just abbreviation, vertically centered -->
        <div class="event-size-minimum flex h-full items-center justify-center p-1">
          <span class="text-xs font-bold [writing-mode:vertical-lr] [text-orientation:mixed]">${titleShort}</span>
        </div>
      </div>
    `
  }
}

export function monthViewEventClassNames(): string[] {
  return [`bg-[${EVENT_SOURCE_COLORS['schedule']}]`]
}
