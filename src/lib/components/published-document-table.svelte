<script lang="ts">
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import type { PublishedDocument } from '$lib/schemas/study-program-artifacts'
  import { fmtDate, fmtSemester, fmtStudyProgramWithoutPO } from '$lib/formats'
  import DataTableTitleButton from './modules-table-title-button.svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Download, Search } from '@lucide/svelte'
  import {
    type ColumnDef,
    type SortingState,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel
  } from '@tanstack/table-core'

  type DataTableProps = {
    data: PublishedDocument[]
    fileBasePath: string
  }

  let { data, fileBasePath }: DataTableProps = $props()

  const columns: ColumnDef<PublishedDocument>[] = [
    {
      id: 'title',
      accessorFn: (document) => fmtStudyProgramWithoutPO(document.studyProgram),
      sortingFn: (a, b) =>
        fmtStudyProgramWithoutPO(a.original.studyProgram).localeCompare(
          fmtStudyProgramWithoutPO(b.original.studyProgram),
          'de'
        ),
      header: 'Studiengang',
      cell: ({ row }) => fmtStudyProgramWithoutPO(row.original.studyProgram)
    },
    {
      id: 'po',
      accessorFn: (document) => document.studyProgram.po.version,
      header: 'Prüfungsordnung',
      cell: ({ row }) => row.original.studyProgram.po.version
    },
    {
      id: 'semester',
      accessorFn: (document) => document.semester.start,
      header: 'Semester',
      cell: ({ row }) => fmtSemester(row.original.semester)
    },
    {
      accessorKey: 'date',
      header: 'Veröffentlicht am',
      cell: ({ row }) => fmtDate(row.original.date)
    },
    {
      id: 'download',
      header: 'Download',
      enableSorting: false
    }
  ]

  let sorting = $state<SortingState>([{ id: 'title', desc: false }])
  let search = $state('')
  let searchInput: HTMLInputElement | null = $state(null)

  function handleSearchShortcut(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
    const target = event.target
    if (
      event.key === '/' &&
      !(
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      )
    ) {
      event.preventDefault()
      searchInput?.focus()
    } else if (event.key === 'Escape' && document.activeElement === searchInput) {
      event.preventDefault()
      search = ''
      searchInput?.blur()
    }
  }

  const table = createSvelteTable({
    get data() {
      return data
    },
    get columns() {
      return columns
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater
    },
    getColumnCanGlobalFilter: (column) => column.id === 'title',
    globalFilterFn: ({ original: document }, _columnId, value: string) => {
      const { studyProgram, semester, date } = document
      const text = [
        fmtStudyProgramWithoutPO(studyProgram),
        studyProgram.abbreviation,
        `PO ${studyProgram.po.version}`,
        fmtSemester(semester),
        semester.abbrev,
        date,
        fmtDate(date)
      ]
        .join(' ')
        .toLocaleLowerCase('de')
      return value
        .toLocaleLowerCase('de')
        .trim()
        .split(/\s+/)
        .every((term) => text.includes(term))
    },
    state: {
      get sorting() {
        return sorting
      },
      get globalFilter() {
        return search
      }
    }
  })
</script>

<svelte:window onkeydown={handleSearchShortcut} />

<div class="min-w-0 space-y-4">
  <div class="flex min-w-0 items-center gap-3">
    <label
      for="document-search"
      class="text-muted-foreground hidden shrink-0 items-center gap-2 text-sm font-medium md:flex md:w-16"
    >
      <Search class="size-4" />Suche
    </label>
    <div class="relative w-full md:max-w-md">
      <Input
        id="document-search"
        type="search"
        bind:value={search}
        bind:ref={searchInput}
        aria-label="Dokumente nach Studiengang, Prüfungsordnung, Semester oder Datum suchen"
        placeholder="Studiengang, PO, Semester oder Datum…"
        class="border-muted-foreground/20 focus-visible:border-primary focus-visible:ring-primary/20 h-10 w-full border-2 pr-10 text-sm transition-colors focus-visible:ring-2"
      />
      {#if !search.trim()}
        <kbd
          class="bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-medium"
          >/</kbd
        >
      {/if}
    </div>
  </div>
  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head
                aria-sort={header.column.getCanSort()
                  ? header.column.getIsSorted() === 'asc'
                    ? 'ascending'
                    : header.column.getIsSorted() === 'desc'
                      ? 'descending'
                      : 'none'
                  : undefined}
              >
                {#if !header.isPlaceholder}
                  {#if header.column.getCanSort()}
                    <DataTableTitleButton
                      fullText={String(header.column.columnDef.header)}
                      shortText={String(header.column.columnDef.header)}
                      sort={header.column.getIsSorted()}
                      onclick={header.column.getToggleSortingHandler()}
                    />
                  {:else}
                    {header.column.columnDef.header}
                  {/if}
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row>
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
                {#if cell.column.id === 'download'}
                  <Button
                    variant="outline"
                    size="sm"
                    class="shadow-sm"
                    href={fileBasePath + encodeURIComponent(row.original.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download class="size-4" />Öffnen
                  </Button>
                {:else}
                  <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                {/if}
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
</div>
