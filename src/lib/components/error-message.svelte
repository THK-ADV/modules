<script lang="ts">
  import { TriangleAlert, X } from '@lucide/svelte'
  import Button from './ui/button/button.svelte'

  let { message = $bindable(undefined), title }: { message: string | undefined; title?: string } =
    $props()

  $effect(() => {
    if (message) {
      const timeout = setTimeout(() => {
        message = undefined
      }, 5000)

      return () => clearTimeout(timeout)
    }
  })
</script>

<!-- TODO: use this everywhere instead custom messages -->
{#if message}
  <div class="border-destructive/20 bg-destructive/5 mb-2 flex gap-2 rounded-md border p-2">
    <TriangleAlert class="text-destructive mt-1 size-4 shrink-0" />
    <div class="flex-1">
      <div class="flex items-center justify-between">
        <h3 class="text-destructive font-medium">{title || 'Fehler'}</h3>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive/60 hover:text-destructive size-6 shrink-0 p-0"
          onclick={() => (message = undefined)}
          aria-label="Fehlermeldung schließen"
        >
          <X class="size-4" />
        </Button>
      </div>
      <p class="text-destructive/80 mt-1 text-sm">{message}</p>
    </div>
  </div>
{/if}
