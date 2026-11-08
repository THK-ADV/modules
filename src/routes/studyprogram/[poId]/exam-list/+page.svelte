<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'
  import type { PageProps } from './$types'
  import ExamListEditor from './(components)/exam-list-editor.svelte'
  import { getExamListConfig, getExamListOptions } from './exam-list.remote'

  let { data }: PageProps = $props()
</script>

{#snippet header()}
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">Prüfungsliste konfigurieren</h1>
    <p class="text-muted-foreground max-w-3xl text-sm">
      Prüfungsphasen und Anmeldezeiträume eines Semesters festlegen, in der Vorschau prüfen und
      freigeben. Neue Module und Prüfungen sind automatisch enthalten.
    </p>
  </div>
{/snippet}

<svelte:boundary>
  <ExamListEditor po={data.poId} {header} />
  {#snippet pending()}
    <div class="space-y-8">
      {@render header()}
      <div
        class="bg-muted/30 flex items-center justify-center gap-3 rounded-xl border px-6 py-20"
        role="status"
      >
        <Spinner class="motion-reduce:animate-none" aria-hidden="true" />
        <p class="text-muted-foreground text-sm">Module werden geladen …</p>
      </div>
    </div>
  {/snippet}
  {#snippet failed(error, reset)}
    <div class="space-y-8">
      {@render header()}
      <div class="space-y-4 rounded-xl border p-6" role="alert">
        <div class="space-y-1">
          <h2 class="font-semibold">Prüfungsliste nicht verfügbar</h2>
          <p class="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
        </div>
        <Button
          variant="outline"
          onclick={() => {
            void Promise.all([
              getExamListOptions(data.poId).refresh(),
              getExamListConfig(data.poId).refresh()
            ]).catch(() => {})
            reset()
          }}>Erneut versuchen</Button
        >
      </div>
    </div>
  {/snippet}
</svelte:boundary>
