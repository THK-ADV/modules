<script lang="ts" module>
  import DataTableTitleButton from '$lib/components/modules-table-title-button.svelte'
  import { renderComponent } from '$lib/components/ui/data-table/index.js'
  import type {
    ModuleType,
    ModuleView,
    PersonShort,
    StudyProgramModuleAssociation
  } from '$lib/types/module'
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

  function fmtStudyPrograms(xs: ReadonlyArray<StudyProgramModuleAssociation>) {
    let res: string[] = []
    for (const { studyProgram } of xs) {
      if (!res.includes(studyProgram.abbreviation)) {
        res.push(studyProgram.abbreviation)
      }
    }
    return res.join(', ')
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
      },
      filterFn: (row, _, filterValue) => {
        const searchValue = (filterValue as string).toLowerCase()
        if (!searchValue) return true
        const title = row.original.title.toLowerCase()
        const abbrev = row.original.abbrev.toLowerCase()
        return title.includes(searchValue) || abbrev.includes(searchValue)
      }
    },
    {
      accessorKey: 'moduleManagement',
      header: 'Modulverantwortliche',
      cell: ({ row }) => fmtModuleManagement(row.original.moduleManagement),
      filterFn: (row, _, filterValue) => {
        const ids = filterValue as string[]
        if (ids.length === 0) {
          return true
        }
        return row.original.moduleManagement.some(({ id }) => ids.includes(id))
      }
    },
    {
      accessorKey: 'studyProgram',
      header: 'Studiengänge',
      cell: ({ row }) => fmtStudyPrograms(row.original.studyProgram),
      filterFn: (row, _, filterValue) => {
        const pos = filterValue as string[]
        if (pos.length === 0) {
          return true
        }
        return row.original.studyProgram.some((s) => pos.includes(s.studyProgram.po.id))
      }
    },
    {
      accessorKey: 'moduleType',
      header: 'Modulart',
      cell: ({ row }) => {
        return renderComponent(DataTableModuleTypeCell, {
          moduleType: row.original.moduleType
        })
      },
      filterFn: (row, _, filterValue) => {
        const ids = filterValue as ModuleType['id'][]
        // if no or both PM and WM are selected, return true, since every module is either PM, WM or both PM and WM (PWM)
        if (ids.length === 0 || ids.length === 2) {
          return true
        }
        const moduleType = row.original.moduleType
        if (moduleType === undefined) {
          return false
        }
        // also select PWM since it is a subset of both PW and WM
        return moduleType.id === ids[0] || moduleType.id === 'pwm'
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
      cell: ({ row }) => fmtSemester(row.original.studyProgram),
      filterFn: (row, _, filterValue) => {
        const ids = filterValue as string[]
        if (ids.length === 0) {
          return true
        }
        return row.original.studyProgram.some(({ recommendedSemester }) =>
          recommendedSemester.some((s) => ids.some((id) => +id === s))
        )
      }
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
