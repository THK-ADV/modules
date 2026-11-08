<script lang="ts">
  import { cn } from '$lib/utils'
  import { plural } from '../exam-planning'
  import { fmtHours, type Invigilation } from './invigilation.svelte'

  let { inv, class: className }: { inv: Invigilation; class?: string } = $props()
</script>

<section class={cn('min-w-0', className)} aria-labelledby="invigilation-roster">
  <div
    class="text-muted-foreground grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] items-end gap-x-2 px-2 pb-2 text-xs"
  >
    <h2 id="invigilation-roster" class="text-foreground text-sm font-semibold">
      Aufsichtspersonen
    </h2>
    <span class="text-right">Aufsichten</span>
    <span class="text-right">Stunden</span>
  </div>
  {#if inv.roster.length}
    <ul>
      {#each inv.roster as person (person.id)}
        {@const filtered = inv.search === person.name}
        <li>
          <button
            type="button"
            class={cn(
              'grid w-full grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] items-center gap-x-2 rounded-md px-2 py-2 text-left transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              filtered ? 'bg-muted' : 'enabled:hover:bg-muted/50'
            )}
            title={filtered ? 'Filter aufheben' : 'Nur Termine dieser Person zeigen'}
            aria-pressed={filtered}
            disabled={!person.count && !filtered}
            onclick={() => {
              inv.search = filtered ? '' : person.name
              inv.view = 'all'
            }}
          >
            <div class="min-w-0">
              <p class="truncate text-sm">{person.name}</p>
              <div
                class="bg-foreground/10 mt-1 h-0.5 overflow-hidden rounded-full"
                aria-hidden="true"
              >
                <div
                  class={cn(
                    'h-full rounded-full',
                    person.overlaps ? 'bg-red-500' : 'bg-foreground/40'
                  )}
                  style:width="{inv.maxMs ? (person.ms / inv.maxMs) * 100 : 0}%"
                ></div>
              </div>
              {#if !person.active || !person.inPool || person.overlaps}
                <p class="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  {[
                    !person.active && 'Nicht aktiv',
                    person.active && !person.inPool && 'Nicht ausgewählt',
                    person.overlaps && plural(person.overlaps, 'Überschneidung', 'Überschneidungen')
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              {/if}
            </div>
            <span class="text-right text-sm tabular-nums">{person.count}</span>
            <span class="text-right text-sm tabular-nums">{fmtHours(person.ms)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-muted-foreground px-1 text-sm">
      Noch niemand eingeteilt. Personen in den Einstellungen auswählen.
    </p>
  {/if}
</section>
