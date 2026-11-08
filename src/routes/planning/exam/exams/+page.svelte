<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'
  import { ClipboardList } from '@lucide/svelte'
  import ExamsView from './exams-view.svelte'
  import { getExams } from './exams.remote'
</script>

{#snippet header()}
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <ClipboardList class="text-muted-foreground size-6" aria-hidden="true" />
      <h1 class="text-3xl font-bold tracking-tight">Prüfungen</h1>
    </div>
    <p class="text-muted-foreground text-sm">
      Prüfungen anlegen, Modulen zuordnen und gleichnamige Prüfungen zusammenführen. Prüfungslisten
      und Prüfungsplanung beziehen sich auf diese Prüfungen.
    </p>
  </div>
{/snippet}

<svelte:boundary>
  <ExamsView {header} />
  {#snippet pending()}
    <div class="mx-auto w-full max-w-6xl space-y-8">
      {@render header()}
      <div
        class="bg-muted/30 flex items-center justify-center gap-3 rounded-xl border px-6 py-20"
        role="status"
      >
        <Spinner class="motion-reduce:animate-none" aria-hidden="true" />
        <p class="text-muted-foreground text-sm">Prüfungen werden geladen …</p>
      </div>
    </div>
  {/snippet}
  {#snippet failed(error, reset)}
    <div class="mx-auto w-full max-w-6xl space-y-8">
      {@render header()}
      <div class="space-y-4 rounded-xl border p-6" role="alert">
        <div class="space-y-1">
          <h2 class="font-semibold">Prüfungen nicht verfügbar</h2>
          <p class="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
        </div>
        <Button
          variant="outline"
          onclick={() => {
            void getExams()
              .refresh()
              .catch(() => {})
            reset()
          }}>Erneut versuchen</Button
        >
      </div>
    </div>
  {/snippet}
</svelte:boundary>
