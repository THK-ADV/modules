<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'
  import { GitBranch } from '@lucide/svelte'
  import BranchConsistency from './(components)/branch-consistency.svelte'
</script>

<div class="mx-auto w-full max-w-6xl space-y-8">
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <GitBranch class="text-muted-foreground size-6" aria-hidden="true" />
      <h1 class="text-3xl font-bold tracking-tight">Git</h1>
    </div>
    <p class="text-muted-foreground text-sm">
      Modul-Branches und Entwürfe abgleichen. Verwaiste Branches und unvollständige Entwürfe
      erkennen.
    </p>
  </div>

  <svelte:boundary>
    <BranchConsistency />
    {#snippet pending()}
      <div
        class="bg-muted/30 flex items-center justify-center gap-3 rounded-xl border px-6 py-20"
        role="status"
      >
        <Spinner class="motion-reduce:animate-none" aria-hidden="true" />
        <p class="text-muted-foreground text-sm">Branches und Entwürfe werden abgeglichen …</p>
      </div>
    {/snippet}
    {#snippet failed(error, reset)}
      <div class="space-y-4 rounded-xl border p-6" role="alert">
        <div class="space-y-1">
          <h2 class="font-semibold">Abgleich nicht verfügbar</h2>
          <p class="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
        </div>
        <Button variant="outline" onclick={reset}>Erneut versuchen</Button>
      </div>
    {/snippet}
  </svelte:boundary>
</div>
