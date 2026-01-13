<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Select from '$lib/components/ui/select/index'
  import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from '@lucide/svelte'
  import type { Table } from '@tanstack/table-core'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { table, pages }: { table: Table<any>; pages: string[] } = $props()
</script>

<div class="flex items-center justify-between">
  <p class="text-muted-foreground text-sm font-medium">
    Anzahl der Einträge: {table.getRowCount()}
  </p>
  <div class="flex justify-end space-x-6 lg:space-x-8">
    <div class="flex items-center space-x-2">
      <p class="text-sm font-medium">Zeilen pro Seite</p>
      <Select.Root
        type="single"
        onValueChange={(a) => {
          table.setPageSize(a === 'Alle' ? table.getRowCount() : +a)
        }}
        value={table.getState().pagination.pageSize.toString()}
      >
        <Select.Trigger class="h-8 w-[70px]">
          {table.getState().pagination.pageSize}
        </Select.Trigger>
        <Select.Content>
          {#each pages as page (page)}
            <Select.Item value={page} label={page}>{page}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
    <div class="flex w-auto items-center justify-center text-sm font-medium">
      Seite {table.getState().pagination.pageIndex + 1} von {table.getPageCount()}
    </div>
    <div class="flex items-center space-x-2">
      <Button
        variant="outline"
        class="hidden size-8 p-0 lg:flex"
        onclick={() => table.firstPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronFirst size={15} />
      </Button>
      <Button
        variant="outline"
        class="size-8 p-0"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeft size={15} />
      </Button>
      <Button
        variant="outline"
        class="size-8 p-0"
        disabled={!table.getCanNextPage()}
        onclick={() => table.nextPage()}
      >
        <ChevronRight size={15} />
      </Button>
      <Button
        variant="outline"
        class="hidden size-8 p-0 lg:flex"
        disabled={!table.getCanNextPage()}
        onclick={() => table.lastPage()}
      >
        <ChevronLast size={15} />
      </Button>
    </div>
  </div>
</div>
