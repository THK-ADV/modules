<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import type { ModuleDraft } from '$lib/types/module-draft'
  import { Star } from '@lucide/svelte'

  let { moduleDraft }: { moduleDraft: ModuleDraft } = $props()

  let rowTitle = $derived.by(() => {
    let title = moduleDraft.module.title
    let abbrev = moduleDraft.module.abbreviation

    if (moduleDraft.moduleDraft) {
      title = moduleDraft.moduleDraft.title
      abbrev = moduleDraft.moduleDraft.abbreviation
    }
    return `${title} (${abbrev}) - ${moduleDraft.ects} ECTS`
  })
</script>

<div class="flex items-center gap-2">
  <a href="/modules/{moduleDraft.module.id}?source=latest" class="hover:underline">
    {rowTitle}
  </a>

  {#if moduleDraft.isFeatured}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Badge
            variant="secondary"
            class="space-x-1 bg-emerald-100 px-2 py-0.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            <Star class="h-4 w-4" />
            <span class="hidden xl:inline">Neu</span>
          </Badge>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Neues Modul im Rahmen der Reakkreditierung</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {/if}
</div>
