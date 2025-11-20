<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { Button } from '$lib/components/ui/button'
  import type { ModuleReviewItem } from '$lib/types/review-request'
  import { Eye } from '@lucide/svelte'

  let { items, moduleId }: { items: ModuleReviewItem[]; moduleId: string } = $props()
  const canReview = $derived(items.some((item) => item.canReview))
</script>

<!-- Desktop: Show all actions inline -->
{#if canReview}
  <Button
    variant="outline"
    size="sm"
    class="border-amber-300 font-medium text-amber-700 shadow-sm transition-colors hover:bg-amber-50 hover:text-amber-800"
    onclick={() => goto(`${page.url.pathname}/${moduleId}`)}
  >
    <Eye class="h-4 w-4" />
    <span class="hidden md:block">Prüfen</span>
  </Button>
{/if}
