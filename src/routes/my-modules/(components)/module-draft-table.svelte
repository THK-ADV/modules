<script lang="ts">
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import type { ModuleDraft } from '$lib/types/module-draft'
  import {
    type ColumnDef,
    getCoreRowModel,
    getSortedRowModel,
    type SortingState
  } from '@tanstack/table-core'

  let {
    moduleDrafts,
    columns
  }: { moduleDrafts: ModuleDraft[]; columns: ColumnDef<ModuleDraft>[] } = $props()

  let sorting = $state<SortingState>([])

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
    // state
    state: {
      get sorting() {
        return sorting
      }
    }
  })
</script>

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
          class={row.original.moduleDraftState.id === 'waiting_for_changes'
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
