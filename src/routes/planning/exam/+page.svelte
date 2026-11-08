<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'
  import { CalendarClock } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ExamPlanList from './(components)/exam-plan-list.svelte'
  import { getExamPlans } from './exam-planning.remote'

  let { data }: PageProps = $props()

  const canEdit = $derived(data.userInfo?.hasExamPlanningPrivileges ?? false)
</script>

{#snippet header()}
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <CalendarClock class="text-muted-foreground size-6" aria-hidden="true" />
      <h1 class="text-3xl font-bold tracking-tight">Prüfungsplanung</h1>
    </div>
    <p class="text-muted-foreground text-sm">
      Prüfungstermine eines Semesters aus den veröffentlichten Prüfungslisten planen und im
      Semesterkalender veröffentlichen.
    </p>
  </div>
{/snippet}

<svelte:boundary>
  <ExamPlanList {header} {canEdit} />
  {#snippet pending()}
    <div class="mx-auto w-full max-w-5xl space-y-8">
      {@render header()}
      <div
        class="bg-muted/30 flex items-center justify-center gap-3 rounded-xl border px-6 py-20"
        role="status"
      >
        <Spinner class="motion-reduce:animate-none" aria-hidden="true" />
        <p class="text-muted-foreground text-sm">Prüfungspläne werden geladen …</p>
      </div>
    </div>
  {/snippet}
  {#snippet failed(error, reset)}
    <div class="mx-auto w-full max-w-5xl space-y-8">
      {@render header()}
      <div class="space-y-4 rounded-xl border p-6" role="alert">
        <div class="space-y-1">
          <h2 class="font-semibold">Prüfungspläne nicht verfügbar</h2>
          <p class="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
        </div>
        <Button
          variant="outline"
          onclick={() => {
            void getExamPlans()
              .refresh()
              .catch(() => {})
            reset()
          }}>Erneut versuchen</Button
        >
      </div>
    </div>
  {/snippet}
</svelte:boundary>
