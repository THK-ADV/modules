<script lang="ts">
  import { coreDataValue } from '$lib/core-data/entities'
  import { type CoreDataRow } from '$lib/schemas/core-data'
  import SuccessMessage from '$lib/components/success-message.svelte'
  import TablePagination from '$lib/components/table-pagination.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    createSvelteTable,
    FlexRender,
    renderComponent
  } from '$lib/components/ui/data-table/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import {
    getCoreDataEntity,
    type CoreDataEntity,
    type CoreDataField,
    type CoreDataOption
  } from '$lib/core-data/entities'
  import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CircleCheck,
    CircleX,
    Plus,
    Search,
    SquarePen
  } from '@lucide/svelte'
  import {
    type ColumnDef,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState
  } from '@tanstack/table-core'
  import { getCoreData } from '$lib/core-data/core-data.remote'
  import CoreDataForm from './core-data-form.svelte'
  import CoreDataIconCell from './core-data-icon-cell.svelte'

  let { entity }: { entity: CoreDataEntity } = $props()

  const entityRows = $derived(
    Object.fromEntries(
      await Promise.all(
        [
          ...new Set([
            entity.key,
            ...entity.fields.flatMap((field) =>
              typeof field.options === 'string' ? [field.options] : []
            )
          ])
        ].map((key) => getCoreData(key).then((rows) => [key, rows] as const))
      )
    )
  )
  const rows = $derived(entityRows[entity.key])
  const optionsByField = $derived(
    new Map(
      entity.fields
        .filter((field) => field.options)
        .map((field): [string, CoreDataOption[]] => {
          if (typeof field.options !== 'string') return [field.name, field.options ?? []]
          const dependency = getCoreDataEntity(field.options)!
          const options = (entityRows[field.options] ?? [])
            .filter(
              (row) =>
                entity.key !== 'studyPrograms' ||
                field.options !== 'identities' ||
                ('kind' in row && row.kind === 'person')
            )
            .map((row) => ({ id: row.id, label: dependency.display(row) }))
          return [field.name, options]
        })
    )
  )

  function formatDate(value: string): string {
    const [y, m, d] = value.slice(0, 10).split('-')
    return y && m && d ? `${d}.${m}.${y}` : value
  }

  function format(
    field: CoreDataField,
    value: unknown,
    options?: CoreDataOption[],
    variant: 'table' | 'search' = 'table'
  ): string {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return '–'
    if (field.type === 'boolean') {
      if (variant === 'search') return value ? 'Ja Aktiv' : 'Nein Inaktiv'
      return value ? 'Ja' : 'Nein'
    }
    if (field.type === 'date') return formatDate(String(value))
    if (options) {
      const ids = Array.isArray(value) ? value : [value]
      return ids
        .map((id) => {
          const option = options.find((option) => option.id === String(id))
          if (!option) return String(id)
          if (variant === 'search') {
            return [option.tableLabel, option.label].filter(Boolean).join(' ')
          }
          return option.tableLabel ?? option.label
        })
        .join(', ')
    }
    return String(value)
  }

  function tableCell(field: CoreDataField, row: CoreDataRow) {
    const value = coreDataValue(row, field.name)
    if (field.name === 'isActive') {
      if (typeof value !== 'boolean') return '–'
      return renderComponent(CoreDataIconCell, {
        icon: value ? CircleCheck : CircleX,
        label: value ? 'Aktiv' : 'Inaktiv',
        class: value
          ? 'fill-green-600 stroke-white dark:fill-green-400 dark:stroke-white'
          : 'fill-amber-600 stroke-white dark:fill-amber-400 dark:stroke-white'
      })
    }
    return format(field, value, optionsByField.get(field.name))
  }

  const columns: ColumnDef<CoreDataRow>[] = $derived([
    ...(entity.displayColumn
      ? [{ id: '_display', header: entity.displayColumn, accessorFn: entity.display }]
      : []),
    ...entity.fields
      .filter((field) => !field.hidden)
      .map((field) => ({
        id: field.name,
        header: field.label,
        accessorFn: (row: CoreDataRow) =>
          field.type === 'number' || field.type === 'date' || field.type === 'boolean'
            ? coreDataValue(row, field.name)
            : format(field, coreDataValue(row, field.name), optionsByField.get(field.name)),
        cell: ({ row }: { row: { original: CoreDataRow } }) => tableCell(field, row.original)
      }))
  ])

  let sorting = $state<SortingState>([])
  let successMessage = $state<string>()
  let pagination = $state({ pageIndex: 0, pageSize: 25 })
  let globalFilter = $state('')

  const table = createSvelteTable<CoreDataRow>({
    get data() {
      return rows
    },
    get columns() {
      return columns
    },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getColumnCanGlobalFilter: () => true,
    globalFilterFn: (row, columnId, query) => {
      const field = entity.fields.find((field) => field.name === columnId)
      const value = field
        ? format(
            field,
            coreDataValue(row.original, field.name),
            optionsByField.get(field.name),
            'search'
          )
        : entity.display(row.original)
      return `${row.id} ${value}`
        .toLocaleLowerCase('de')
        .includes(String(query).trim().toLocaleLowerCase('de'))
    },
    onSortingChange: (update) =>
      (sorting = typeof update === 'function' ? update(sorting) : update),
    onPaginationChange: (update) =>
      (pagination = typeof update === 'function' ? update(pagination) : update),
    state: {
      get sorting() {
        return sorting
      },
      get pagination() {
        return pagination
      },
      get globalFilter() {
        return globalFilter
      }
    }
  })

  /** undefined = form closed, null = create, row = edit */
  let editing = $state<CoreDataRow | null | undefined>(undefined)

  let searchInputEl: HTMLInputElement | null = $state(null)
  const showSearchShortcut = $derived(globalFilter.trim().length === 0)

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (editing !== undefined) return

    if (event.key === '/') {
      const target = event.target
      if (target instanceof HTMLElement) {
        if (
          target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT'
        ) {
          return
        }
      }
      if (document.activeElement !== searchInputEl) {
        event.preventDefault()
        searchInputEl?.focus()
      }
      return
    }

    if (event.key === 'Escape' && document.activeElement === searchInputEl) {
      event.preventDefault()
      globalFilter = ''
      searchInputEl?.blur()
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="min-w-0 space-y-4">
  {#if successMessage}
    <div role="status"><SuccessMessage bind:message={successMessage} /></div>
  {/if}
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div class="relative w-full sm:max-w-xs">
      <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        bind:value={globalFilter}
        bind:ref={searchInputEl}
        placeholder="Suchen…"
        aria-label={`${entity.label} durchsuchen`}
        class="pl-8 {showSearchShortcut ? 'pr-10' : ''}"
      />
      {#if showSearchShortcut}
        <kbd
          class="bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-medium"
          >/</kbd
        >
      {/if}
    </div>
    <Button onclick={() => (editing = null)}>
      <Plus class="size-4" />
      {entity.singular} anlegen
    </Button>
  </div>

  <div class="overflow-hidden rounded-lg border">
    <Table.Root>
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row class="bg-muted/40 hover:bg-muted/40">
            {#each headerGroup.headers as header (header.id)}
              {@const sorted = header.column.getIsSorted()}
              <Table.Head
                aria-sort={sorted === 'asc'
                  ? 'ascending'
                  : sorted === 'desc'
                    ? 'descending'
                    : 'none'}
              >
                <button
                  type="button"
                  class="hover:text-foreground flex items-center gap-1"
                  onclick={header.column.getToggleSortingHandler()}
                >
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                  {#if sorted === 'asc'}
                    <ArrowUp class="size-3.5" />
                  {:else if sorted === 'desc'}
                    <ArrowDown class="size-3.5" />
                  {:else}
                    <ArrowUpDown class="size-3.5 opacity-40" />
                  {/if}
                </button>
              </Table.Head>
            {/each}
            <Table.Head class="bg-muted/40 sticky right-0 w-14">Aktionen</Table.Head>
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
          <Table.Row class="hover:bg-transparent">
            {#each row.getVisibleCells() as cell (cell.id)}
              <Table.Cell>
                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
              </Table.Cell>
            {/each}
            <Table.Cell class="bg-background sticky right-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500/50 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                aria-label={`${entity.display(row.original)} bearbeiten`}
                title="Bearbeiten"
                onclick={() => (editing = row.original)}
              >
                <SquarePen class="size-4" />
              </Button>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row class="hover:bg-transparent">
            <Table.Cell colspan={columns.length + 1} class="text-muted-foreground h-24 text-center">
              {globalFilter
                ? 'Keine passenden Einträge gefunden.'
                : 'Noch keine Einträge vorhanden.'}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  {#if table.getRowCount() > 0}
    <TablePagination {table} pages={['10', '25', '50', 'Alle']} />
  {/if}
</div>

<CoreDataForm
  {entity}
  {optionsByField}
  item={editing}
  onClose={() => (editing = undefined)}
  onSaved={() => {
    successMessage = 'Der Eintrag wurde gespeichert.'
    editing = undefined
  }}
/>
