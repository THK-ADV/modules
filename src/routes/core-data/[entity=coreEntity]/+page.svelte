<script lang="ts">
  import { page } from '$app/state'
  import { Button } from '$lib/components/ui/button/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getCoreDataEntity } from '$lib/core-data/entities'
  import { getErrorMessage } from '$lib/errors'
  import CoreDataView from '../(components)/core-data-view.svelte'

  const entity = $derived(getCoreDataEntity(page.params.entity!)!)
</script>

<div class="flex h-full flex-1 flex-col space-y-6">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">{entity.label}</h1>
    <p class="text-muted-foreground text-sm">Stammdaten anlegen und bearbeiten.</p>
  </div>

  {#key entity.key}
    <svelte:boundary>
      <CoreDataView {entity} />
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
  {/key}
</div>
