<script lang="ts" module>
  import { renderComponent } from '$lib/components/ui/data-table/index.js'
  import type { ColumnDef } from '@tanstack/table-core'

  function fmtStudyProgram(studyProgram: StudyProgram) {
    if (studyProgram.specialization) {
      return `${studyProgram.deLabel} ${studyProgram.specialization.deLabel} (${studyProgram.degree.deLabel})`
    }
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel})`
  }

  const columns: ColumnDef<StudyProgramPrivileges>[] = [
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
      id: 'actions',
      cell: ({ row }) => {
        return renderComponent(PreviewTableActions, {
          studyProgramPrivileges: row.original
        })
      }
    }
  ]
</script>

<script lang="ts">
  import type { StudyProgram } from '$lib/types/study-program'
  import type { StudyProgramPrivileges } from '$lib/types/study-program-privileges'
  import type { PageProps } from './$types'
  import PreviewTableActions from './(components)/preview-table-actions.svelte'
  import PreviewTable from './(components)/preview-table.svelte'

  let { data }: PageProps = $props()
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">
      Vorschau für Modulhandbücher und Prüfungslisten
    </h2>
    <p class="text-sm text-muted-foreground">
      Für die Vorschau werden ausschließlich Module berücksichtigt, die in dieser Bearbeitungsphase
      veröffentlicht wurden.
    </p>
  </div>
  <PreviewTable data={data.privileges} {columns} />
</div>
