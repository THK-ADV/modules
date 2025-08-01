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
      enableColumnFilter: false,
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
          isPrivilegedForModule: row.original.isPrivilegedForModule
        })
      }
    }
  ]
</script>

<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { Button } from '$lib/components/ui/button'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import type { ModuleDraft } from '$lib/types/module-draft'
  import { ChartLine, ChevronDown, ChevronUp } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ModuleDraftTitleCell from './(components)/module-draft-title-cell.svelte'

  let { data }: PageProps = $props()

  const hasAccreditationModules =
    data.moduleDrafts.accreditation && data.moduleDrafts.accreditation.length > 0

  let selectedTab = $state('default')
  let moduleDrafts = $derived.by(() => {
    const tab = selectedTab
    if (tab === 'default') {
      return data.moduleDrafts.default
    }
    return data.moduleDrafts.accreditation || []
  })

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
    <div class="rounded-md border border-green-200 bg-green-50 p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-green-800">Modul erfolgreich aktualisiert</h3>
        </div>
        <div class="ml-auto pl-3">
          <button
            type="button"
            class="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
            onclick={() => (showSuccessMessage = false)}
            aria-label="Erfolgsmeldung schließen"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if moduleDrafts.length > 0}
    <div class="space-y-8">
      <div class="space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Meine Module</h2>
        <p class="break-words text-sm text-muted-foreground">
          Sie können die folgenden Module bearbeiten und die Änderungen übernehmen oder zur
          Genehmigung freigeben. Eine Genehmigung ist nur bei <a
            class="text-primary underline hover:no-underline"
            href="/help/approval">Änderungen bestimmter Attribute</a
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
            <ChartLine class="mr-1 h-4 w-4" />
            {showSemesterProgress
              ? 'Erklärung zum Bearbeitungszyklus ausblenden'
              : 'Erklärung zum Bearbeitungszyklus anzeigen'}
            {#if showSemesterProgress}
              <ChevronUp class="ml-1 h-4 w-4" />
            {:else}
              <ChevronDown class="ml-1 h-4 w-4" />
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
        {#if hasAccreditationModules}
          <Tabs.Root bind:value={selectedTab}>
            <Tabs.List>
              <Tabs.Trigger value="default">Zugewiesene Module</Tabs.Trigger>
              <Tabs.Trigger value="accreditation">Module aus Reakkreditierung</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="accreditation" class="ml-1">
              <p class="break-words text-sm text-muted-foreground">
                Im Rahmen der Reakkreditierung können Sie alle Module bearbeiten
              </p>
            </Tabs.Content>
          </Tabs.Root>
        {/if}
        <ModuleDraftTable {moduleDrafts} {columns} />
      </div>
    {/if}
  {:else}
    <div class="space-y-2">
      <h2 class="text-2xl font-bold tracking-tight">Meine Module</h2>
      <p class="break-words text-sm text-muted-foreground">
        Sie werden in keinem Modul als Modulverantwortliche*r geführt oder haben keine zugeteiliten
        Module.
      </p>
    </div>
  {/if}
</div>
