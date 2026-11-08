import { toExamEvent, type CalendarEvent, type ExamEventProps } from '$lib/calendar'
import { publishedExamEntrySchema, type PublishedExamEntry } from '$lib/schemas/exam-planning'
import { examListLabelSchemas } from '$lib/schemas/exam-list'
import { z } from 'zod/v4'
import { fetchBackendJson } from './http'

const labelError = 'Stammdaten konnten nicht geladen werden'

/** Fetches the published exam appointments overlapping the range of epoch milliseconds as calendar events. */
export async function fetchPublishedExamEvents(
  fetch: typeof globalThis.fetch,
  from: number,
  to: number
): Promise<CalendarEvent<ExamEventProps<PublishedExamEntry>>[]> {
  const params = new URLSearchParams({ from: String(from), to: String(to) })
  const [entries, methods] = await Promise.all([
    fetchBackendJson(
      fetch,
      `/api/examEntries?${params}`,
      z.array(publishedExamEntrySchema),
      'Prüfungstermine konnten nicht geladen werden'
    ),
    fetchBackendJson(
      fetch,
      '/api/assessmentMethods',
      examListLabelSchemas.assessmentMethods,
      labelError
    )
  ])
  const methodLabels = new Map(methods.map((m) => [m.id, m.deLabel]))
  return entries.map((entry) => toExamEvent(entry, methodLabels))
}
