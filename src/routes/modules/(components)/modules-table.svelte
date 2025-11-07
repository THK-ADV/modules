<script lang="ts">
  import TablePagination from '$lib/components/table-pagination.svelte'
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import { moduleFilter } from '$lib/store.svelte'
  import type { ModuleView } from '$lib/types/module'
  import {
    type ColumnDef,
    type ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState
  } from '@tanstack/table-core'
  import DataTableFilter from './modules-table-filter.svelte'

  function getInitialColumnFilters(): ColumnFiltersState {
    const filters: ColumnFiltersState = []

    if (moduleFilter.selectedStudyPrograms.length > 0) {
      filters.push({ id: 'studyProgram', value: moduleFilter.selectedStudyPrograms })
    }
    if (moduleFilter.selectedIdentities.length > 0) {
      filters.push({ id: 'moduleManagement', value: moduleFilter.selectedIdentities })
    }
    if (moduleFilter.selectedSemester.length > 0) {
      filters.push({ id: 'semester', value: moduleFilter.selectedSemester })
    }
    if (moduleFilter.selectedModuleTypes.length > 0) {
      filters.push({ id: 'moduleType', value: moduleFilter.selectedModuleTypes })
    }
    if (moduleFilter.title.length > 0) {
      filters.push({ id: 'title', value: moduleFilter.title })
    }

    return filters
  }

  type DataTableProps = {
    columns: ColumnDef<ModuleView>[]
    data: ModuleView[]
  }

  let { data, columns }: DataTableProps = $props()

  const pages = moduleFilter.pages

  let sorting = $state<SortingState>([])
  let columnFilters = $state<ColumnFiltersState>(getInitialColumnFilters())
  let pagination = $derived(moduleFilter.pagination)

  $effect(() => {
    // keep pagination in sync with store to allow state persistence through navigation
    moduleFilter.pagination = pagination
  })

  const table = createSvelteTable({
    // data
    get data() {
      return data
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    // sorting
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      if (typeof updater === 'function') {
        sorting = updater(sorting)
      } else {
        sorting = updater
      }
    },
    // filter
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: (updater) => {
      if (typeof updater === 'function') {
        columnFilters = updater(columnFilters)
      } else {
        columnFilters = updater
      }
    },
    // pagination
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        pagination = updater(pagination)
      } else {
        pagination = updater
      }
    },
    // state
    state: {
      get sorting() {
        return sorting
      },
      get columnFilters() {
        return columnFilters
      },
      get pagination() {
        return pagination
      }
    },
    initialState: { columnVisibility: { studyProgram: false } }
  })
</script>

<div class="space-y-4">
  <DataTableFilter {table} />
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head>
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row data-state={row.getIsSelected() && 'selected'}>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
              </Table.Cell>
            {/each}
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={columns.length} class="h-24 text-center"
              >Keine Ergebnisse.</Table.Cell
            >
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
  <TablePagination {table} {pages} />
</div>
