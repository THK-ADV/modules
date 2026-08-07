<script lang="ts">
  import { resolve } from '$app/paths'
  import ModuleDetail from './module-detail.svelte'
  import { Button } from '$lib/components/ui/button'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { canEdit, type ModuleDraftState } from '$lib/types/module-draft'
  import { SquarePen, X } from '@lucide/svelte'
  import { getLatestModuleDetail } from './module-preview.remote'

  let {
    id,
    moduleDraftState,
    onClose
  }: {
    id: string
    moduleDraftState: ModuleDraftState
    onClose?: () => void
  } = $props()
</script>

{#snippet actions()}
  <div class="flex items-center gap-1">
    {#if canEdit(moduleDraftState)}
      <Button
        href={resolve('/my-modules/[id=uuid]', { id })}
        variant="outline"
        size="sm"
        class="border-blue-400 text-blue-600 shadow-sm hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500/50 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
      >
        <SquarePen />
        Bearbeiten
      </Button>
    {/if}
    {#if onClose}
      <Button variant="ghost" size="icon" class="size-9" onclick={onClose}>
        <X />
        <span class="sr-only">Vorschau schließen</span>
      </Button>
    {/if}
  </div>
{/snippet}

<div class="bg-background flex h-full flex-col">
  <div class="flex-1 overflow-y-auto px-6 pb-6" class:pt-6={!onClose}>
    {#await getLatestModuleDetail(id)}
      <div class="space-y-8">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <Skeleton class="h-9 w-2/3 max-w-md" />
            <div class="shrink-0">{@render actions()}</div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Skeleton class="h-8 w-28 rounded-full" />
            <Skeleton class="h-8 w-24 rounded-full" />
            <Skeleton class="h-8 w-32 rounded-full" />
          </div>
          <Skeleton class="h-4 w-40" />
        </div>

        <div class="grid grid-cols-1 gap-6">
          <div class="space-y-3 rounded-xl border p-6">
            <Skeleton class="h-5 w-36" />
            <div class="space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-5/6" />
              <Skeleton class="h-4 w-4/5" />
              <Skeleton class="h-4 w-3/4" />
            </div>
          </div>
          <div class="space-y-3 rounded-xl border p-6">
            <Skeleton class="h-5 w-28" />
            <div class="flex items-center gap-4">
              <Skeleton class="size-12 rounded-full" />
              <div class="space-y-2">
                <Skeleton class="h-4 w-40" />
                <Skeleton class="h-3 w-28" />
              </div>
            </div>
          </div>
          <div class="space-y-3 rounded-xl border p-6">
            <Skeleton class="h-5 w-32" />
            <div class="space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-11/12" />
              <Skeleton class="h-4 w-2/3" />
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <Skeleton class="h-6 w-48" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-4/5" />
        </div>
      </div>
    {:then module}
      <!-- Generic-module candidates are intentionally omitted because they are not part of the draft preview. -->
      <ModuleDetail
        {module}
        genericModuleOptions={[]}
        isAuthenticated={false}
        compact={true}
        headerActions={actions}
      />
    {:catch}
      <p class="text-destructive text-sm">Der aktuelle Modulstand konnte nicht geladen werden.</p>
    {/await}
  </div>
</div>
