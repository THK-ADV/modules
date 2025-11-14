<script lang="ts">
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import type { ModuleReview } from '$lib/types/review-request'
  import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core'

  let {
    moduleReviews,
    columns
  }: { moduleReviews: ModuleReview[]; columns: ColumnDef<ModuleReview>[] } = $props()

  const table = createSvelteTable({
    // data
    get data() {
      return moduleReviews
    },
    columns,
    getCoreRowModel: getCoreRowModel()
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
          class={row.original.status.id === 'waiting_for_changes'
            ? 'bg-muted/20 text-muted-foreground/80'
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
