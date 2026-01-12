<script lang="ts" module>
  import { renderComponent } from '$lib/components/ui/data-table'
  import type { ExamList } from '$lib/types/exam-list'
  import { DateFormatter } from '@internationalized/date'
  import type { ColumnDef } from '@tanstack/table-core'
  import ExamListDownloadButton from './(components)/exam-list-download-button.svelte'

  function fmtStudyProgram(studyProgram: StudyProgram) {
    if (studyProgram.specialization) {
      return `${studyProgram.deLabel} ${studyProgram.specialization.deLabel} (${studyProgram.degree.deLabel})`
    }
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel})`
  }

  function fmtSemester(semester: Semester) {
    return `${semester.deLabel} ${semester.year}`
  }

  const df = new DateFormatter('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const columns: ColumnDef<ExamList>[] = [
    {
      accessorKey: 'title',
      header: 'Studiengang',
      cell: ({ row }) => fmtStudyProgram(row.original.studyProgram)
    },
    {
      accessorKey: 'po',
      header: 'Prüfungsordnung',
      cell: ({ row }) => row.original.studyProgram.po.version
    },
    {
      accessorKey: 'semester',
      header: 'Semester',
      cell: ({ row }) => fmtSemester(row.original.semester)
    },
    {
      accessorKey: 'date',
      header: 'Veröffentlicht am',
      cell: ({ row }) => df.format(new Date(row.original.date))
    },
    {
      accessorKey: 'download',
      header: 'Download',
      cell: ({ row }) => renderComponent(ExamListDownloadButton, { examList: row.original })
    }
  ]
</script>

<script lang="ts">
  import type { Semester } from '$lib/types/semester'
  import type { StudyProgram } from '$lib/types/study-program'
  import type { PageProps } from './$types'
  import ExamListTable from './(components)/exam-list-table.svelte'

  let { data }: PageProps = $props()
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Prüfungslisten</h2>
    <p class="text-muted-foreground text-sm">
      Veröffentlichte Prüfungslisten aller Studiengänge der TH Köln am Campus Gummersbach.
    </p>
  </div>
  <ExamListTable {columns} data={data.examLists} />
</div>
