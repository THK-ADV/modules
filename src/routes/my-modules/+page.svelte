<script lang="ts" module>
  import { renderComponent } from '$lib/components/ui/data-table/index.js'
  import type { ColumnDef } from '@tanstack/table-core'
  import ModuleDraftStatusCell from './(components)/module-draft-status-cell.svelte'
  import ModuleDraftTableActions from './(components)/module-draft-table-actions.svelte'
  import ModuleDraftTable from './(components)/module-draft-table.svelte'
  import SemesterCycleProgress from './(components)/semester-cycle-progress.svelte'

  const columns: ColumnDef<ModuleDraft>[] = [
    {
      accessorKey: 'title',
      header: 'Modulbezeichnung',
      cell: ({ row }) => {
        return renderComponent(ModuleDraftTitleCell, { moduleDraft: row.original })
      },
      filterFn: (row, _, filterValue) => {
        if (!filterValue) {
          return true
        }
        const filter = filterValue.toString().toLowerCase()
        const title = (row.original.moduleDraft?.title ?? row.original.module.title).toLowerCase()
        return title.includes(filter)
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return renderComponent(ModuleDraftStatusCell, { state: row.original.moduleDraftState })
      },
      enableColumnFilter: false
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return renderComponent(ModuleDraftTableActions, {
          moduleId: row.original.module.id,
          moduleDraftState: row.original.moduleDraftState,
          canBeFastForwardApproved: row.original.canBeFastForwardApproved
        })
      }
    }
  ]
</script>

<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import SuccessMessage from '$lib/components/success-message.svelte'
  import { Button } from '$lib/components/ui/button'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import type { ModuleDraft } from '$lib/types/module-draft'
  import { BookOpen, Plus } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ModuleDraftTitleCell from './(components)/module-draft-title-cell.svelte'
  let { data }: PageProps = $props()

  const canCreateModules = $derived(data.userInfo?.hasExtendedModuleEditPermissions ?? false)

  let moduleDrafts = $derived(data.moduleDrafts)
  let hasAdditionalModules = $derived(data.hasAdditionalModules)
  let showSuccessMessage = $state<string | undefined>(undefined)

  $effect(() => {
    const action = page.url.searchParams.get('action')
    if (browser && action) {
      showSuccessMessage =
        action === 'updated' ? 'Modul wurde aktualisiert' : 'Modul wurde erstellt'

      // clean up URL after showing message
      const url = new URL(page.url)
      url.searchParams.delete('action')
      goto(url.toString(), { replaceState: true, noScroll: true })
    }
  })

  async function createNewModule() {
    await goto(`/my-modules/${crypto.randomUUID()}/general?mode=create`)
  }
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  {#if showSuccessMessage}
    <SuccessMessage message={showSuccessMessage} />
  {/if}

  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0 space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-bold tracking-tight">Meine Module</h2>
        {#if canCreateModules}
          <Button onclick={createNewModule} class="shrink-0 sm:hidden" size="icon">
            <Plus class="size-4" />
          </Button>
        {/if}
      </div>
      <p class="text-muted-foreground text-sm wrap-break-word">
        Sie können die folgenden Module bearbeiten und die Änderungen übernehmen oder zur
        Genehmigung freigeben. Eine Genehmigung ist nur bei <a
          class="text-foreground decoration-muted-foreground/40 hover:decoration-foreground underline underline-offset-2 transition-colors"
          href="/help#review-process"
          target="_blank"
          rel="noopener noreferrer">Änderungen bestimmter Attribute</a
        >
        notwendig.
      </p>
    </div>
    {#if canCreateModules}
      <Button onclick={createNewModule} class="hidden shrink-0 gap-2 sm:inline-flex">
        <Plus class="size-4" />
        Neues Modul
      </Button>
    {/if}
  </div>

  {#if moduleDrafts.length > 0}
    <SemesterCycleProgress />
  {/if}

  {#if moduleDrafts.length > 0}
    <ModuleDraftTable {moduleDrafts} {columns} {hasAdditionalModules} />
  {:else}
    <Empty.Root class="border-border/70 bg-muted/30 min-h-[320px] border">
      <Empty.Header class="gap-3">
        <Empty.Media variant="icon" class="bg-muted text-muted-foreground size-14 rounded-2xl">
          <BookOpen class="size-7" />
        </Empty.Media>
        <Empty.Title>Keine Module zugewiesen</Empty.Title>
        <Empty.Description class="max-w-sm">
          Sie werden derzeit in keinem Modul als Modulverantwortliche*r geführt und haben keine über
          Rollen zugeteilten Module.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {/if}
</div>
