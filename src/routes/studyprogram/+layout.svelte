<script lang="ts">
  import type { LayoutProps } from './$types'
  import { Button } from '$lib/components/ui/button'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'

  let { children }: LayoutProps = $props()
</script>

<svelte:boundary>
  {@render children()}
  {#snippet pending()}
    <div class="flex justify-center py-16"><Spinner /></div>
  {/snippet}
  {#snippet failed(error, reset)}
    <div class="space-y-3" role="alert">
      <p class="text-destructive text-sm">{getErrorMessage(error)}</p>
      <Button variant="outline" onclick={reset}>Erneut versuchen</Button>
    </div>
  {/snippet}
</svelte:boundary>
