import { fmtManagement } from '$lib/formats'
import type { CourseType } from '$lib/types/schedule'
import type { EventContentArg } from '@fullcalendar/core/index.js'
import type { ScheduleEventProps } from '.'
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

function fmtCourseType(courseType: CourseType): string {
  switch (courseType) {
    case 'lecture':
      return 'Vorlesung'
    case 'lab':
      return 'Praktikum'
    case 'exercise':
      return 'Übung'
    case 'seminar':
      return 'Seminar'
    case 'tutorial':
      return 'Tutorium'
  }
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

  const props = arg.event.extendedProps as ScheduleEventProps
  const time = arg.timeText

  // Long versions
  const titleLong = props.moduleTitle
  const lecturerLong = props.moduleManagement.map((m) => fmtManagement(m)).join(', ')
  const courseTypeLong = fmtCourseType(props.courseType)

  // Short versions
  const titleShort = props.moduleAbbrev
  const lecturerShort = props.moduleManagement
    .map((m) => {
      switch (m.kind) {
        case 'person':
          return `${m.firstname.charAt(0)}${m.lastname.charAt(0)}`
        case 'group':
          return m.id.slice(0, 3).toUpperCase()
        case 'unknown':
          return m.id.slice(0, 3).toUpperCase()
      }
    })
    .join(', ')
  const courseTypeShort = courseTypeLong.charAt(0)

  // Always the same
  const location = props.roomAbbrev

  return {
    html: `
      <div class="event-content flex h-full flex-col dark:text-white">
        <!-- Full view -->
        <div class="event-size-full flex flex-col gap-1.5 p-2">
          <div class="text-sm font-semibold leading-tight">${titleLong}</div>
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
  return [`bg-[${EVENT_SOURCE_COLORS['schedule']}]`, 'text-white']
}
