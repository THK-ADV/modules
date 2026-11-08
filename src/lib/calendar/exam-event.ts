import type { ExamEntry } from '$lib/schemas/exam-planning'
import { examMethodLabels } from '$lib/types/exam-planning'
import { EXAM_COLOR, type CalendarEvent, type ExamEventProps } from './types'

/** Maps an exam appointment to a calendar event. */
export function toExamEvent<E extends ExamEntry>(
  entry: E,
  methods: Map<string, string>
): CalendarEvent<ExamEventProps<E>> {
  return {
    id: entry.id,
    title: entry.examName,
    start: entry.start,
    end: entry.end,
    backgroundColor: EXAM_COLOR,
    borderColor: EXAM_COLOR,
    extendedProps: {
      source: 'exam',
      raw: entry,
      methodLabels: examMethodLabels(entry.assessmentMethod, methods)
    }
  }
}
