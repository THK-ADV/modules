<script lang="ts" module>
  import DataTableTitleButton from '$lib/components/modules-table-title-button.svelte'
  import { renderComponent } from '$lib/components/ui/data-table/index.js'
  import type { ModuleView, PersonShort, StudyProgramModuleAssociation } from '$lib/types/module'
  import type { ColumnDef } from '@tanstack/table-core'
  import DataTableModuleTypeCell from './(components)/modules-table-moduleType-cell.svelte'

  const fmtCredits = creditsFormatter()

  function fmtModuleManagement(xs: ReadonlyArray<PersonShort>) {
    let res = ''
    for (const [i, x] of xs.entries()) {
      switch (x.kind) {
        case 'person':
          if (x.firstname.length > 0) {
            res += `${x.lastname}, ${x.firstname.charAt(0)}.`
            if (i < xs.length - 1) {
              res += ' & '
            }
          }
          break
        case 'group':
          res += x.title
          break
        case 'unknown':
          res += x.title
          break
      }
    }
    return res
  }

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
          onclick: column.getToggleSortingHandler()
        })
      },
      cell: ({ row }) => {
        return renderComponent(ModuleTableTitleCell, {
          id: row.original.id,
          title: row.original.title,
          status: row.original.status
        })
      }
    },
    {
      accessorKey: 'moduleManagement',
      header: 'Modulverantwortliche',
      cell: ({ row }) => fmtModuleManagement(row.original.moduleManagement)
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
  import { creditsFormatter } from '$lib/formats'

  let { data }: PageProps = $props()

  const latestModuleUpdate = $derived(
    data.latestModuleUpdate?.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  )
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
