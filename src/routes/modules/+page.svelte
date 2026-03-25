<script lang="ts" module>
  import DataTableTitleButton from '$lib/components/modules-table-title-button.svelte'
  import { renderComponent } from '$lib/components/ui/data-table/index.js'
  import type { ModuleView, StudyProgramModuleAssociation } from '$lib/types/module'
  import type { ColumnDef } from '@tanstack/table-core'
  import DataTableModuleTypeCell from './(components)/modules-table-moduleType-cell.svelte'

  const fmtCredits = creditsFormatter()

  function fmtSemester(xs: ReadonlyArray<StudyProgramModuleAssociation>) {
    let semester: number[]
    const res: Record<number, undefined> = {}
    for (const { recommendedSemester } of xs) {
      for (const s of recommendedSemester) {
        res[s] = undefined
      }
    }
    semester = Object.keys(res).map((s) => +s)
    if (semester.length === 0) {
      return '-'
    } else {
      semester.sort()
      return semester.join(', ')
    }
  }

  const columns: ColumnDef<ModuleView>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => {
        return renderComponent(DataTableTitleButton, {
          onclick: column.getToggleSortingHandler(),
          sort: column.getIsSorted(),
          fullText: 'Modulbezeichnung',
          shortText: 'Modulbez.'
        })
      },
      cell: ({ row }) => {
        return renderComponent(ModuleTableTitleCell, {
          id: row.original.id,
          title: row.original.title,
          abbrev: row.original.abbrev,
          status: row.original.status
        })
      },
      sortingFn: 'alphanumeric'
    },
    {
      accessorKey: 'moduleManagement',
      header: ({ column }) => {
        return renderComponent(DataTableTitleButton, {
          onclick: column.getToggleSortingHandler(),
          sort: column.getIsSorted(),
          fullText: 'Modulverantwortliche',
          shortText: 'MV.'
        })
      },
      cell: ({ row }) => {
        return renderComponent(ModuleTableManagementCell, {
          management: row.original.moduleManagement
        })
      },
      sortingFn: (lhs, rhs) => {
        if (
          lhs.original.moduleManagement.length === 0 ||
          rhs.original.moduleManagement.length === 0
        ) {
          return 0
        }
        return peopleShortOrdering(
          lhs.original.moduleManagement[0],
          rhs.original.moduleManagement[0]
        )
      }
    },
    {
      accessorKey: 'moduleType',
      header: 'Modulart',
      cell: ({ row }) => {
        return renderComponent(DataTableModuleTypeCell, {
          moduleType: row.original.moduleType
        })
      }
    },
    {
      accessorKey: 'credits',
      header: 'ECTS',
      cell: ({ row }) => fmtCredits.format(row.original.ects)
    },
    {
      accessorKey: 'semester',
      header: 'Semester',
      cell: ({ row }) => fmtSemester(row.original.studyProgram)
    }
  ]
</script>

<script lang="ts">
  import { Calendar } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ModuleTableTitleCell from './(components)/module-table-title-cell.svelte'
  import ModulesTable from './(components)/modules-table.svelte'
  import { creditsFormatter, peopleShortOrdering } from '$lib/formats'
  import ModuleTableManagementCell from './(components)/modules-table-management-cell.svelte'

  let { data }: PageProps = $props()

  const latestModuleUpdate = $derived.by(() => {
    const latest = data.latestModuleUpdate as Date | null
    if (!latest) {
      return null
    }

    return latest.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  })
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Modulbeschreibungen</h2>
    <p class="text-muted-foreground text-sm">
      Veröffentlichte Modulbeschreibungen aller Studiengänge der TH Köln am Campus Gummersbach.
    </p>
    {#if latestModuleUpdate}
      <div class="text-muted-foreground flex items-center gap-2 text-sm">
        <Calendar class="size-4" />
        <span class="text-sm">Letzte Aktualisierung: {latestModuleUpdate}</span>
      </div>
    {/if}
  </div>
  <ModulesTable data={data.modules} {columns} />
</div>
