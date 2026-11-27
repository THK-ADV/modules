<script lang="ts">
  import QueryError from '$lib/components/query-error.svelte'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { GitPullRequestArrow } from '@lucide/svelte'
  import ModulePublication from './(components)/module-publication.svelte'
  import { getModuleChanges } from './publication.remote'
</script>

{#snippet header()}
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <GitPullRequestArrow class="text-muted-foreground size-6" aria-hidden="true" />
      <h1 class="text-3xl font-bold tracking-tight">Module veröffentlichen</h1>
    </div>
    <p class="text-muted-foreground text-sm">
      Änderungen aus <code class="font-mono">preview</code> prüfen und ausgewählte Module nach
      <code class="font-mono">main</code> übernehmen.
    </p>
  </div>
{/snippet}

<svelte:boundary>
  <ModulePublication {header} />
  {#snippet pending()}
    <div class="mx-auto w-full max-w-6xl space-y-8">
      {@render header()}
      <div
        class="bg-muted/30 flex items-center justify-center gap-3 rounded-xl border px-6 py-20"
        role="status"
      >
        <Spinner class="motion-reduce:animate-none" aria-hidden="true" />
        <p class="text-muted-foreground text-sm">preview und main werden verglichen …</p>
      </div>
    </div>
  {/snippet}
  {#snippet failed(error, reset)}
    <div class="mx-auto w-full max-w-6xl space-y-8">
      {@render header()}
      <QueryError title="Vergleich nicht verfügbar" {error} {reset} query={getModuleChanges()} />
    </div>
  {/snippet}
</svelte:boundary>
