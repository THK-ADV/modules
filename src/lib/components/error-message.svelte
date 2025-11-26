<script lang="ts">
  import { TriangleAlert, X } from '@lucide/svelte'
  import Button from './ui/button/button.svelte'

  let { message = $bindable(undefined), title }: { message: string | undefined; title?: string } =
    $props()

  setTimeout(() => {
    message = undefined
  }, 5000)
</script>

<!-- TODO: use this everywhere instead custom messages -->
{#if message}
  <div class="mb-2 flex gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-2">
    <TriangleAlert class="mt-1 h-4 w-4 flex-shrink-0 text-destructive" />
    <div class="flex-1">
      <div class="flex items-center justify-between">
        <h3 class="font-medium text-destructive">{title || 'Fehler'}</h3>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 flex-shrink-0 p-0 text-destructive/60 hover:text-destructive"
          onclick={() => (message = undefined)}
          aria-label="Fehlermeldung schließen"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
      <p class="mt-1 text-sm text-destructive/80">{message}</p>
    </div>
  </div>
{/if}
