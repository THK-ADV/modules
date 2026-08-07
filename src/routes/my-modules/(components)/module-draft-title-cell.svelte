<script lang="ts" module>
  import { creditsFormatter } from '$lib/formats'

  const fmtCredits = creditsFormatter()
</script>

<script lang="ts">
  import { resolve } from '$app/paths'
  import { Badge } from '$lib/components/ui/badge/index.js'

  import type { ModuleDraft } from '$lib/types/module-draft'
  import { Star } from '@lucide/svelte'

  let {
    moduleDraft,
    onPreview
  }: { moduleDraft: ModuleDraft; onPreview?: (moduleDraft: ModuleDraft) => void } = $props()

  let rowTitle = $derived.by(() => {
    let title = moduleDraft.module.title

    if (moduleDraft.moduleDraft) {
      title = moduleDraft.moduleDraft.title
    }
    return `${title} - ${fmtCredits.format(moduleDraft.ects)} ECTS`
  })

  function openPreview(event: MouseEvent) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (onPreview && window.matchMedia('(min-width: 1024px)').matches) {
      event.preventDefault()
      onPreview(moduleDraft)
    }
  }
</script>

<div class="flex items-center gap-2">
  <a
    href={resolve('/my-modules/preview/[id=uuid]', { id: moduleDraft.module.id })}
    class="text-left hover:underline"
    onclick={openPreview}
  >
    {rowTitle}
  </a>

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
