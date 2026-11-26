<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'
  import { UserRoundCheck } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import InvigilationDuties from './invigilation-duties.svelte'
  import { getInvigilationLabels, getUpcomingInvigilations } from './invigilations.remote'

  let { data }: PageProps = $props()
</script>

{#snippet header()}
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <UserRoundCheck class="text-muted-foreground size-6" aria-hidden="true" />
      <h1 class="text-3xl font-bold tracking-tight">Klausuraufsichten</h1>
    </div>
    <p class="text-muted-foreground text-sm">
      Veröffentlichte Klausurtermine mit Räumen, Prüfenden und eingeteilten Aufsichtspersonen.
    </p>
  </div>
{/snippet}

<svelte:boundary>
  <InvigilationDuties me={data.me} {header} />
  {#snippet pending()}
    <div class="mx-auto w-full max-w-5xl space-y-6">
      {@render header()}
      <div
        class="bg-muted/30 flex items-center justify-center gap-3 rounded-xl border px-6 py-20"
        role="status"
      >
        <Spinner class="motion-reduce:animate-none" aria-hidden="true" />
        <p class="text-muted-foreground text-sm">Klausurtermine werden geladen …</p>
      </div>
    </div>
  {/snippet}
  {#snippet failed(error, reset)}
    <div class="mx-auto w-full max-w-5xl space-y-6">
      {@render header()}
      <div class="space-y-4 rounded-xl border p-6" role="alert">
        <div class="space-y-1">
          <h2 class="font-semibold">Klausurtermine nicht verfügbar</h2>
          <p class="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
        </div>
        <Button
          variant="outline"
          onclick={() => {
            // The remounted view starts again with my upcoming duties.
            void Promise.all([
              getUpcomingInvigilations().refresh(),
              getInvigilationLabels().refresh()
            ]).catch(() => {})
            reset()
          }}>Erneut versuchen</Button
        >
      </div>
    </div>
  {/snippet}
</svelte:boundary>
