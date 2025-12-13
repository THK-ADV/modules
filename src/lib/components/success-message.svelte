<script lang="ts">
  import { Check, X } from '@lucide/svelte'
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

{#if message}
  <div class="mb-2 flex gap-2 rounded-md border border-green-200 bg-green-50 p-2">
    <Check class="mt-1 h-4 w-4 flex-shrink-0 text-green-800" />
    <div class="flex-1">
      <div class="flex items-center justify-between">
        <h3 class="font-medium text-green-800">{title || 'Erfolg'}</h3>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 flex-shrink-0 p-0"
          onclick={() => (message = undefined)}
          aria-label="Erfolgsmeldung schließen"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
      <p class="mt-1 text-sm text-green-800">{message}</p>
    </div>
  </div>
{/if}
