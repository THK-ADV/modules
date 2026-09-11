<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'
  import PermissionsView from './(components)/permissions-view.svelte'
</script>

<div class="flex h-full flex-1 flex-col space-y-6">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">Berechtigungen</h1>
    <p class="text-muted-foreground text-sm">Berechtigungen anlegen, bearbeiten und löschen.</p>
  </div>

  <svelte:boundary>
    <PermissionsView />
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
</div>
