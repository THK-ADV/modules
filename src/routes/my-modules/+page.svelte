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
      },
      size: 300
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return renderComponent(ModuleDraftStatusCell, { state: row.original.moduleDraftState })
      },
      enableColumnFilter: false,
      size: 280
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
  import type { ModuleDraft } from '$lib/types/module-draft'
  import { ChartLine, ChevronDown, ChevronUp } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ModuleDraftTitleCell from './(components)/module-draft-title-cell.svelte'

  let { data }: PageProps = $props()

  let moduleDrafts = $derived(data.moduleDrafts)
  let hasAdditionalModules = $derived(data.hasAdditionalModules)

  let showSuccessMessage = $state(false)
  let isPublishingPhase = $state(false)
  let showSemesterProgress = $state(false)

  $effect(() => {
    if (browser && page.url.searchParams.has('updated')) {
      showSuccessMessage = true

      // clean up URL after showing message
      const url = new URL(page.url)
      url.searchParams.delete('updated')
      goto(url.toString(), { replaceState: true, noScroll: true })

      // auto-hide after 5 seconds
      setTimeout(() => {
        showSuccessMessage = false
      }, 5000)
    }
  })
</script>

<div class="w-full max-w-none space-y-8">
  <!-- Success message -->
  {#if showSuccessMessage}
    <SuccessMessage message={showSuccessMessage} />
  {/if}

  {#if moduleDrafts.length > 0}
    <div class="space-y-8">
      <div class="space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Meine Module</h2>
        <p class="text-muted-foreground text-sm wrap-break-word">
          Sie können die folgenden Module bearbeiten und die Änderungen übernehmen oder zur
          Genehmigung freigeben. Eine Genehmigung ist nur bei <a
            class="text-primary underline hover:no-underline"
            href="/help#review-process"
            target="_blank"
            rel="noopener noreferrer">Änderungen bestimmter Attribute</a
          >
          notwendig.
        </p>
        {#if !isPublishingPhase}
          <Button
            variant="ghost"
            size="sm"
            onclick={() => (showSemesterProgress = !showSemesterProgress)}
            class="h-auto p-2 text-sm"
          >
            <ChartLine class="mr-1 size-4" />
            {showSemesterProgress
              ? 'Erklärung zum Bearbeitungszyklus ausblenden'
              : 'Erklärung zum Bearbeitungszyklus anzeigen'}
            {#if showSemesterProgress}
              <ChevronUp class="ml-1 size-4" />
            {:else}
              <ChevronDown class="ml-1 size-4" />
            {/if}
          </Button>
        {/if}
      </div>
    </div>

    <SemesterCycleProgress
      bind:isPublishingPhase
      showComponent={showSemesterProgress || isPublishingPhase}
    />

    {#if !isPublishingPhase}
      <div class="w-full space-y-4">
        <ModuleDraftTable {moduleDrafts} {columns} {hasAdditionalModules} />
      </div>
    {/if}
  {:else}
    <div class="space-y-2">
      <h2 class="text-2xl font-bold tracking-tight">Meine Module</h2>
      <p class="text-muted-foreground text-sm wrap-break-word">
        Sie werden in keinem Modul als Modulverantwortliche*r geführt oder haben keine zugeteilten
        Module.
      </p>
    </div>
  {/if}
</div>
