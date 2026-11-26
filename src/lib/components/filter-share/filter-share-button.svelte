<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { cn } from '$lib/utils.js'
  import { Check, Copy } from '@lucide/svelte'
  import { getShareUrl, type ShareableFilter } from './filter-share'

  let { filter }: { filter: ShareableFilter } = $props()

  let copied = $state(false)

  async function share() {
    const url = getShareUrl(filter)
    try {
      await navigator.clipboard.writeText(url)
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch {
      window.prompt('Link manuell kopieren:', url)
    }
  }
</script>

<Button onclick={share} variant="outline" size="sm" class="h-8 border-dashed">
  {#if copied}
    <Check class="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  {:else}
    <Copy aria-hidden="true" />
  {/if}
  <span class="grid justify-items-start" aria-live="polite">
    <span class={cn('col-start-1 row-start-1', copied && 'invisible')}>Filteransicht teilen</span>
    <span class={cn('col-start-1 row-start-1', !copied && 'invisible')}>Link kopiert</span>
  </span>
</Button>
