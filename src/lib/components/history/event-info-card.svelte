<script lang="ts">
  import { type ModuleVersion } from '$lib/types/module-version'
  import { TriangleAlert, Trash2 } from '@lucide/svelte'
  import { cn } from '$lib/utils'

  let { event }: { event: ModuleVersion } = $props()

  const isDeleted = $derived(event.content.type === 'deleted')

  function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
</script>

<div class="grid grid-cols-[auto_1fr] items-start gap-3">
  <div
    class={cn(
      'inline-flex size-9 shrink-0 items-center justify-center rounded-full ring-1',
      isDeleted
        ? 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300'
        : 'bg-amber-500/10 text-amber-600 ring-amber-500/25 dark:text-amber-400'
    )}
    aria-hidden="true"
  >
    {#if isDeleted}
      <Trash2 class="size-4" />
    {:else}
      <TriangleAlert class="size-4" />
    {/if}
  </div>
  <div class="flex min-w-0 flex-col gap-3">
    <div class="flex flex-col gap-1">
      <h4 class="text-foreground m-0 text-sm font-semibold">
        {isDeleted ? 'Modul wurde gelöscht' : 'Parsing-Fehler'}
      </h4>
      <span class="text-muted-foreground text-xs tabular-nums">
        {formatDate(event.committedAt)} · {event.semester.deLabel} · {event.commitId.slice(0, 7)}
      </span>
    </div>
    {#if event.content.type === 'parseError'}
      <pre
        class="text-foreground bg-muted border-border m-0 max-h-96 overflow-x-auto rounded-md border p-2.5 font-mono text-xs whitespace-pre-wrap">{event
          .content.message}</pre>
    {:else}
      <p class="text-muted-foreground m-0 text-sm leading-relaxed">
        Diese Version markiert eine Löschung. Eine vorherige Version kann weiterhin zum Vergleich
        ausgewählt werden.
      </p>
    {/if}
  </div>
</div>
