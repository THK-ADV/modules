import type {
  BookingEventProps,
  CalendarEvent,
  ExamEventProps,
  ScheduleEventProps
} from '$lib/calendar'
import type { PublishedExamEntry } from '$lib/schemas/exam-planning'
import type { ScheduleFilter } from '$lib/stores/schedule-filter.svelte'
import type { BookingKind } from '$lib/types/booking'
import { semesterIdOf } from '$lib/types/semester'
import type { RemoteQuery } from '@sveltejs/kit'
import { fetchBookings } from './booking.remote'
import type { ScheduleEntryEditorApi } from './schedule-entry-editor-api'
import { fetchPublishedExamEntries } from './schedule.remote'

/** Epoch milliseconds; `end` is exclusive. */
export interface DateRange {
  start: number
  end: number
}

interface ScheduleSourceOptions {
  filter: ScheduleFilter
  loadScheduleEntries: ScheduleEntryEditorApi['load']
  bookingKinds: BookingKind[]
  /** Editors read their own writes; the read-only calendar uses the backend cache. */
  bypassCache: boolean
  /** Shows published exams, which only the read-only calendar does. */
  exams?: boolean
}

/**
 * Remote queries for the visible range, loaded only while their source is shown. Schedule entries
 * are many (about 1 MB per month) and load per range; bookings are few (about 100 per semester) and
 * load per semester. Remote functions cache them by arguments, so revisited ranges are reused.
 */
export class ScheduleSources {
  /** Set by the calendar on navigation. */
  range = $state.raw<DateRange>()
  readonly #options: () => ScheduleSourceOptions

  constructor(options: () => ScheduleSourceOptions) {
    this.#options = options
  }

  readonly scheduleEntries = $derived.by(() => {
    const { filter, loadScheduleEntries, bypassCache } = this.#options()
    return this.range && filter.showSchedule
      ? loadScheduleEntries({ ...this.range, bypassCache })
      : undefined
  })

  readonly #bookingSemesters = $derived.by(() => {
    const { showSchedule, showCampus, showFaculty } = this.#options().filter
    if (!this.range || !(showSchedule || showCampus || showFaculty)) return []
    // A week may straddle two semesters.
    const first = semesterIdOf(this.range.start)
    const last = semesterIdOf(this.range.end - 1)
    return first === last ? [first] : [first, last]
  })

  readonly bookings: RemoteQuery<CalendarEvent<BookingEventProps>[]>[] = $derived.by(() => {
    const { bookingKinds: kinds, bypassCache } = this.#options()
    return this.#bookingSemesters.map((semester) => fetchBookings({ semester, kinds, bypassCache }))
  })

  readonly examEntries:
    | RemoteQuery<CalendarEvent<ExamEventProps<PublishedExamEntry>>[]>
    | undefined = $derived.by(() => {
    const { filter, exams } = this.#options()
    return this.range && exams && filter.showExams
      ? fetchPublishedExamEntries(this.range)
      : undefined
  })

  /** Sources whose last load failed. */
  readonly failed = $derived(
    [this.scheduleEntries, ...this.bookings, this.examEntries].filter(
      (query) => query?.error !== undefined
    )
  )

  retry() {
    for (const query of this.failed) query?.refresh()
  }

  /** Applies saved schedule entries without refetching the range. */
  patchScheduleEntries(changed: CalendarEvent<ScheduleEventProps>[], removedIds: string[] = []) {
    const query = this.scheduleEntries
    if (query?.current) query.set(patchEvents(query.current, changed, removedIds))
  }

  /** Applies saved bookings to the semester they start in, without refetching it. */
  patchBookings(changed: CalendarEvent<BookingEventProps>[], removedIds: string[] = []) {
    this.bookings.forEach((query, i) => {
      if (!query.current) return
      const semester = this.#bookingSemesters[i]
      const own = changed.filter((e) => semesterIdOf(e.start) === semester)
      const moved = changed.filter((e) => !own.includes(e)).map((e) => e.id)
      query.set(patchEvents(query.current, own, [...removedIds, ...moved]))
    })
  }
}

/** Replaces events by id and appends new ones. Untouched events keep their identity, so the calendar patches only the changed ones. */
function patchEvents<T extends CalendarEvent>(
  events: T[],
  changed: T[],
  removedIds: string[]
): T[] {
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to the patch
  const updates = new Map(changed.map((e) => [e.id, e]))
  const removed = new Set(removedIds)
  const next: T[] = []
  for (const event of events) {
    if (removed.has(event.id)) continue
    const update = updates.get(event.id)
    next.push(update ?? event)
    updates.delete(event.id)
  }
  next.push(...updates.values())
  return next
}
