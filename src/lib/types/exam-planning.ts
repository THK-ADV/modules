import type { ExamEntry } from '$lib/schemas/exam-planning'

/** Distinct first examiners of the modules of an appointment. */
export function examExaminers(entry: Pick<ExamEntry, 'modules'>) {
  const examiners = entry.modules.flatMap((m) => m.firstExaminer ?? [])
  return [...new Map(examiners.map((e) => [e.id, e])).values()]
}

/** Module abbreviations of an appointment, falling back to the exam name. */
export const examModuleAbbrevs = (entry: Pick<ExamEntry, 'modules' | 'examName'>) =>
  entry.modules.map((m) => m.abbrev).join(', ') || entry.examName

/** Label of the selected assessment method, none for ambiguous legacy entries; unknown ids are shown as they are. */
export const examMethodLabels = (method: string | null, labels: Map<string, string>) =>
  method ? [labels.get(method) ?? method] : []

/** Room as shown to participants, with the part of them sitting there, e.g. `0401 (A-Me)`. */
export const examRoomLabel = (
  room: Pick<ExamEntry['rooms'][number], 'abbrev' | 'partitionValue'>
) => (room.partitionValue ? `${room.abbrev} (${room.partitionValue})` : room.abbrev)
