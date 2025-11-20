<script lang="ts">
  import TablePagination from '$lib/components/table-pagination.svelte'
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import { myModuleFilter } from '$lib/store.svelte'
  import type { ModuleDraft } from '$lib/types/module-draft'
  import {
    type ColumnDef,
    type ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState
  } from '@tanstack/table-core'
  import ModuleDraftTableFilter from './module-draft-table-filter.svelte'
  import type { Selection } from './types'

  function getInitialColumnFilters(): ColumnFiltersState {
    const filters: ColumnFiltersState = []
    if (myModuleFilter.searchString.length > 0) {
      filters.push({ id: 'title', value: myModuleFilter.searchString })
    }
    return filters
  }

  let {
    moduleDrafts,
    columns,
    hasAdditionalModules
  }: {
    moduleDrafts: ModuleDraft[]
    columns: ColumnDef<ModuleDraft>[]
    hasAdditionalModules: boolean
  } = $props()

  const pages = myModuleFilter.pages

  let sorting = $state<SortingState>([])
  let pagination = $derived(myModuleFilter.pagination)
  let columnFilters = $state<ColumnFiltersState>(getInitialColumnFilters())
  let globalFilter = $derived(myModuleFilter.currentSelection)

  $effect(() => {
    // keep pagination in sync with store to allow state persistence through navigation
    myModuleFilter.pagination = pagination
  })

  const table = createSvelteTable({
    // data
    get data() {
      return moduleDrafts
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
    // pagination
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        pagination = updater(pagination)
      } else {
        pagination = updater
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
    // global filter
    getColumnCanGlobalFilter: (column) => column.id === 'title', // Enable global filtering only for title column
    globalFilterFn: (row, _, filterValue) => {
      const selection = filterValue as Selection
      if (!selection || selection === 'all') {
        return true
      }
      if (selection === 'my') {
        return row.original.isDirectlyAssigned === true
      }
      if (selection === 'role') {
        return row.original.isDerivedFromRole === true
      }
      return true
    },
    onGlobalFilterChange: (updater) => {
      if (typeof updater === 'function') {
        globalFilter = updater(globalFilter) as Selection
      } else {
        globalFilter = updater as Selection
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
      },
      get globalFilter() {
        return globalFilter
      }
    }
  })
</script>

<div class="space-y-4">
  <ModuleDraftTableFilter {table} {hasAdditionalModules} />
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
          <Table.Row
            data-state={row.getIsSelected() && 'selected'}
            class={row.original.moduleDraftState === 'waiting_for_changes'
              ? 'border-l-4 border-l-amber-400 bg-amber-50/50 hover:bg-amber-50/70'
              : ''}
          >
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
