<script lang="ts">
  import { getModuleReviewKeys } from '$lib/components/module-review.remote'

  const { showComponent }: { showComponent: boolean } = $props()
  // Loaded only once the explanation is shown.
  const reviewKeys = $derived(showComponent ? await getModuleReviewKeys() : [])
</script>

{#if reviewKeys.length > 0}
  <div class="rounded-lg border bg-linear-to-r from-amber-50 to-yellow-50 p-6">
    <div class="space-y-4">
      <div class="space-y-2">
        <h3 class="text-foreground text-lg font-semibold">Prüfprozess</h3>
        <p class="text-muted-foreground text-sm">
          Folgende Modulattribute lösen bei Änderungen einen Prüfprozess aus. In der Prüfung werden
          die Änderungen entweder akzeptiert oder mit Änderungswünschen zurückgesendet.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each reviewKeys as key (key.id)}
          <span
            class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
            >{key.label}</span
          >
        {/each}
      </div>
    </div>
  </div>
{/if}
