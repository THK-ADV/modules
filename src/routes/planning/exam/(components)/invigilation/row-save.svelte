<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { cn } from '$lib/utils'
  import { Check, LoaderCircle, Save, Undo2 } from '@lucide/svelte'
  import type { Invigilation, Row } from './invigilation.svelte'

  let { inv, row, class: className }: { inv: Invigilation; row: Row; class?: string } = $props()

  const saving = $derived(inv.saving.has(row.id))
  const saved = $derived(inv.saved.has(row.id))
</script>

{#if row.dirty || saving || saved}
  <div class={cn('flex flex-wrap items-center gap-1', className)}>
    <Button size="sm" variant="outline" onclick={() => inv.save(row)}>
      {#if saving}<LoaderCircle
          class="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />{:else if saved}<Check
          class="text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />{:else}<Save aria-hidden="true" />{/if}
      <span class="grid justify-items-start" aria-live="polite">
        <span class={cn('col-start-1 row-start-1', saved && 'invisible')}>Speichern</span>
        <span class={cn('col-start-1 row-start-1', !saved && 'invisible')}>Gespeichert</span>
      </span>
    </Button>
    {#if row.dirty}
      <Button
        variant="ghost"
        size="icon"
        class="size-8"
        title="Änderungen verwerfen"
        aria-label="Änderungen an {row.entry.examName} verwerfen"
        onclick={() => inv.discard(row.id)}
      >
        <Undo2 aria-hidden="true" />
      </Button>
    {/if}
  </div>
{/if}
{#if inv.rowErrors.get(row.id)}
  <p class="text-destructive text-sm" role="alert">{inv.rowErrors.get(row.id)}</p>
{/if}
