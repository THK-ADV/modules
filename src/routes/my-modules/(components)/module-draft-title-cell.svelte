<script lang="ts" module>
  import { creditsFormatter } from '$lib/formats'

  const fmtCredits = creditsFormatter()
</script>

<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'

  import type { ModuleDraft } from '$lib/types/module-draft'
  import { Star } from '@lucide/svelte'

  let { moduleDraft }: { moduleDraft: ModuleDraft } = $props()

  let rowTitle = $derived.by(() => {
    let title = moduleDraft.module.title

    if (moduleDraft.moduleDraft) {
      title = moduleDraft.moduleDraft.title
    }
    return `${title} - ${fmtCredits.format(moduleDraft.ects)} ECTS`
  })
</script>

<div class="flex items-center gap-2">
  <!-- enable link to module detail page once it's implemented -->
  <!-- <a href="/modules/{moduleDraft.module.id}?source=latest" class="hover:underline">
    {rowTitle}
  </a> -->
  <span>{rowTitle}</span>

  {#if moduleDraft.isNewModule}
    <Badge
      variant="secondary"
      class="space-x-1 bg-emerald-100 px-2 py-0.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
    >
      <Star class="size-4" />
      <span class="hidden xl:inline">Neu</span>
    </Badge>
  {/if}
</div>
