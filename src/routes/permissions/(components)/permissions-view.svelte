<script lang="ts">
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { toStudyProgramFilterOption } from '$lib/components/study-program-filter'
  import SuccessMessage from '$lib/components/success-message.svelte'
  import TablePagination from '$lib/components/table-pagination.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import {
    createSvelteTable,
    FlexRender,
    renderComponent
  } from '$lib/components/ui/data-table/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import * as Table from '$lib/components/ui/table/index.js'
  import { getCoreData } from '$lib/core-data/core-data.remote'
  import { getErrorMessage } from '$lib/errors'
  import { fmtStudyProgram } from '$lib/formats'
  import type { Permission } from '$lib/schemas/permission'
  import { getFullPOId } from '$lib/types/study-program'
  import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, SquarePen, Trash2 } from '@lucide/svelte'
  import {
    type ColumnDef,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState
  } from '@tanstack/table-core'
  import { deletePermission, getPermissions, getStudyPrograms } from '../permissions.remote'
  import PermissionContextCell from './permission-context-cell.svelte'
  import PermissionForm from './permission-form.svelte'

  const [permissions, studyPrograms, identities] = $derived(
    await Promise.all([getPermissions(), getStudyPrograms(), getCoreData('identities')])
  )

  const studyProgramById = $derived(new Map(studyPrograms.map((sp) => [getFullPOId(sp), sp])))
  const contextOptions = $derived(studyPrograms.map(toStudyProgramFilterOption))
  const people = $derived(
    identities
      .flatMap((identity) =>
        'kind' in identity && identity.kind === 'person' && identity.isActive
          ? [{ id: identity.id, deLabel: `${identity.lastname}, ${identity.firstname}` }]
          : []
      )
      .sort((a, b) => a.deLabel.localeCompare(b.deLabel, 'de'))
  )

  const personName = (permission: Permission) =>
    `${permission.person.lastname}, ${permission.person.firstname}`

  const columns: ColumnDef<Permission>[] = $derived([
    { id: 'person', header: 'Person', accessorFn: personName },
    { id: 'permType', header: 'Berechtigung', accessorFn: (row) => row.permType.label },
    {
      id: 'context',
      header: 'Kontext',
      accessorFn: (row) =>
        (row.context ?? [])
          .map((id) => {
            const studyProgram = studyProgramById.get(id)
            return studyProgram ? `${id} ${fmtStudyProgram(studyProgram)}` : id
          })
          .join(' '),
      cell: ({ row }: { row: { original: Permission } }) =>
        renderComponent(PermissionContextCell, {
          context: row.original.context ?? [],
          studyPrograms: studyProgramById
        })
    }
  ])

  let sorting = $state<SortingState>([{ id: 'person', desc: false }])
  let pagination = $state({ pageIndex: 0, pageSize: 25 })
  let globalFilter = $state('')
  let successMessage = $state<string>()

  const table = createSvelteTable<Permission>({
    get data() {
      return permissions
    },
    get columns() {
      return columns
    },
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getColumnCanGlobalFilter: () => true,
    globalFilterFn: (row, columnId, query) =>
      String(row.getValue(columnId))
        .toLocaleLowerCase('de')
        .includes(String(query).trim().toLocaleLowerCase('de')),
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
  let editing = $state<Permission | null | undefined>(undefined)
  let deleting = $state<Permission>()
  let deleteError = $state<string>()
  let removing = $state(false)

  function openDelete(permission: Permission) {
    deleteError = undefined
    deleting = permission
  }

  async function confirmDelete() {
    if (!deleting || removing) return
    removing = true
    deleteError = undefined
    try {
      await deletePermission(deleting.id)
      successMessage = 'Die Berechtigung wurde gelöscht.'
      deleting = undefined
    } catch (error) {
      deleteError = getErrorMessage(error)
      await getPermissions().refresh()
    } finally {
      removing = false
    }
  }

  let searchInputEl: HTMLInputElement | null = $state(null)
  const showSearchShortcut = $derived(globalFilter.trim().length === 0)

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (editing !== undefined || deleting) return

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
        aria-label="Berechtigungen durchsuchen"
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
      Berechtigung anlegen
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
            <Table.Head class="bg-muted/40 sticky right-0 w-24">Aktionen</Table.Head>
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
              <div class="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500/50 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                  aria-label={`Kontext von ${personName(row.original)} (${row.original.permType.label}) bearbeiten`}
                  title="Bearbeiten"
                  onclick={() => (editing = row.original)}
                >
                  <SquarePen class="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  aria-label={`Berechtigung ${row.original.permType.label} von ${personName(row.original)} löschen`}
                  title="Löschen"
                  onclick={() => openDelete(row.original)}
                >
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row class="hover:bg-transparent">
            <Table.Cell colspan={columns.length + 1} class="text-muted-foreground h-24 text-center">
              {globalFilter
                ? 'Keine passenden Einträge gefunden.'
                : 'Noch keine Berechtigungen vorhanden.'}
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

{#if editing !== undefined}
  <PermissionForm
    item={editing}
    {permissions}
    {people}
    {contextOptions}
    onClose={() => (editing = undefined)}
    onSaved={(message) => {
      successMessage = message
      editing = undefined
    }}
  />
{/if}

<Dialog.Root
  open={deleting !== undefined}
  onOpenChange={(open) => {
    if (!open && !removing) deleting = undefined
  }}
>
  <Dialog.Content showClose={!removing} class="sm:max-w-lg">
    {#if deleting}
      <Dialog.Header>
        <Dialog.Title>Berechtigung löschen?</Dialog.Title>
        <Dialog.Description>
          Die Berechtigung „{deleting.permType.label}“ für {personName(deleting)} wird unwiderruflich
          entfernt.
        </Dialog.Description>
      </Dialog.Header>
      <ErrorMessage bind:message={deleteError} />
      <Dialog.Footer class="gap-2">
        <Button variant="outline" disabled={removing} onclick={() => (deleting = undefined)}>
          Abbrechen
        </Button>
        <Button variant="destructive" disabled={removing} onclick={confirmDelete}>
          {#if removing}
            <Spinner size="sm" />
          {:else}
            <Trash2 class="size-4" />
          {/if}
          Löschen
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
