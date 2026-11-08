<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { cn } from '$lib/utils'
  import { Check, LoaderCircle, UserRoundPlus } from '@lucide/svelte'
  import { plural } from '../exam-planning'
  import type { Invigilation } from './invigilation.svelte'

  let { inv }: { inv: Invigilation } = $props()

  const count = $derived(inv.selectedRows.length)
  const allOpenSelected = $derived(inv.openRows.every((row) => inv.selection.has(row.id)))
</script>

<div
  class="bg-background/95 supports-backdrop-filter:bg-background/80 sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border p-3 pl-5 shadow-lg backdrop-blur"
>
  <p class="text-sm" aria-live="polite">
    <span class="font-semibold tabular-nums">{count}</span>
    <span class="text-muted-foreground">{count === 1 ? 'Termin' : 'Termine'} ausgewählt</span>
    {#if count}
      <span class="text-muted-foreground">mit</span>
      <span class={cn('tabular-nums', inv.selectedOpen && 'text-amber-700 dark:text-amber-400')}
        >{plural(inv.selectedOpen, 'offenen Aufsicht', 'offenen Aufsichten')}</span
      >
    {/if}
  </p>
  {#if count}
    <Button variant="ghost" size="sm" onclick={() => inv.selection.clear()}>Auswahl aufheben</Button
    >
  {/if}
  {#if inv.openRows.length && !allOpenSelected}
    <Button variant="ghost" size="sm" onclick={inv.selectOpen}>Offene auswählen</Button>
  {/if}
  <Button
    class="ml-auto"
    disabled={!inv.selectedOpen && !inv.assigning && !inv.assigned}
    onclick={inv.assign}
  >
    {#if inv.assigning}<LoaderCircle
        class="animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />{:else if inv.assigned}<Check aria-hidden="true" />{:else}<UserRoundPlus
        aria-hidden="true"
      />{/if}
    <span class="grid justify-items-start" aria-live="polite">
      <span class={cn('col-start-1 row-start-1', inv.assigned && 'invisible')}
        >Automatisch zuweisen</span
      >
      <span class={cn('col-start-1 row-start-1', !inv.assigned && 'invisible')}>Zugewiesen</span>
    </span>
  </Button>
</div>
