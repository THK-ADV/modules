<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { getErrorMessage } from '$lib/errors'
  import { cn } from '$lib/utils'
  import { Check, LoaderCircle, RefreshCw } from '@lucide/svelte'

  let {
    refresh,
    onError
  }: {
    /** Reloads the queries shown by the view; local drafts are kept by their components. */
    refresh: () => Promise<unknown>
    onError: (message: string) => void
  } = $props()

  let status = $state<'busy' | 'done'>()

  async function run() {
    if (status === 'busy') return
    status = 'busy'
    try {
      await refresh()
      status = 'done'
      setTimeout(() => status === 'done' && (status = undefined), 2000)
    } catch (error) {
      status = undefined
      onError(getErrorMessage(error))
    }
  }
</script>

<Button variant="outline" onclick={run}>
  {#if status === 'busy'}
    <LoaderCircle class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
  {:else if status === 'done'}
    <Check class="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
  {:else}
    <RefreshCw aria-hidden="true" />
  {/if}
  <span class="grid justify-items-start" aria-live="polite">
    <span class={cn('col-start-1 row-start-1', status === 'done' && 'invisible')}
      >Aktualisieren</span
    >
    <span class={cn('col-start-1 row-start-1', status !== 'done' && 'invisible')}>Aktualisiert</span
    >
  </span>
</Button>
