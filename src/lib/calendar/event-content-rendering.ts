import { fmtManagement } from '$lib/formats'
import type { EventContentArg } from '@fullcalendar/core/index.js'
import type { ScheduleEventProps } from '.'

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
  return `<div class="flex items-center gap-1.5 text-xs opacity-70">${icon}<span>${text}</span></div>`
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
  user: createIcon(['M16 7a4 4 0 11-8 0 4 4 0 018 0z', 'M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'])
}

/**
 * Render the event content for schedule events.
 * @param arg - The event content argument.
 * @returns The event content as a string.
 */
export function renderEventContent(arg: EventContentArg) {
  // Only apply custom layout for schedule events, use default for others
  if (arg.event.extendedProps?.source !== 'schedule') {
    return true
  }

  const props = arg.event.extendedProps as ScheduleEventProps
  const time = arg.timeText
  const title = arg.event.title

  const lecturer = props.moduleManagement.map((m) => fmtManagement(m)).join(', ')
  const location = props.roomAbbrev

  return {
    html: `<div class="flex flex-col gap-1.5 p-2 dark:text-white border dark:border-white">
             <div class="text-base font-semibold leading-tight">${title}</div>
             ${createInfoRow(ICONS.clock, time)}
             ${createInfoRow(ICONS.mapPin, location)}
             ${createInfoRow(ICONS.user, lecturer)}
           </div>`
  }
}
