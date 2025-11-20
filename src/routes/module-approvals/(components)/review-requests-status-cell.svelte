<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import type { ModuleReviewItem, ModuleReviewStatus } from '$lib/types/review-request'

  let { status, items }: { status: ModuleReviewStatus; items: ModuleReviewItem[] } = $props()

  const MAX_VISIBLE = 4
  const pending = $derived(items.filter((a) => a.canReview))
  const visiblePrograms = $derived(
    pending
      .slice(0, MAX_VISIBLE)
      .sort((a, b) => a.studyProgram.deLabel.localeCompare(b.studyProgram.deLabel))
  )
  const hiddenCount = $derived(Math.max(0, pending.length - MAX_VISIBLE))
  const heading = $derived.by(() => {
    const { id, approved, needed } = status
    if (id === 'waiting_for_changes') {
      return 'Das Review wurde von einem Reviewer zurückgewiesen. Der / Die MV muss aktiv werden und Anpassungen vornehmen.'
    }
    if (approved == null || needed == null) {
      return 'Review-Status unbekannt.'
    }
    if (approved === 0 && needed === 1) {
      return 'Das Review ist noch ausstehend.'
    }
    return `Das Review von ${needed - approved} Personen ist noch ausstehend.`
  })
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <span class="cursor-help">{status.deLabel}</span>
    </Tooltip.Trigger>
    <Tooltip.Content class="max-w-[24rem] whitespace-normal">
      <div class="space-y-2">
        <p class="font-medium">{heading}</p>
        {#if pending.length > 0}
          <div class="flex flex-wrap gap-1.5">
            {#each visiblePrograms as p (p.reviewId)}
              <span
                class="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/90 ring-1 ring-border"
              >
                {p.studyProgram.deLabel}
              </span>
            {/each}
            {#if hiddenCount > 0}
              <span
                class="rounded-full px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border"
              >
                +{hiddenCount} weitere
              </span>
            {/if}
          </div>
        {/if}
      </div>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
