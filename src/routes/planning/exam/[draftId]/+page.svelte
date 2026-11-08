<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { getErrorMessage } from '$lib/errors'
  import { CalendarClock } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import ExamPlanEditor from '../(components)/exam-plan-editor.svelte'
  import {
    getExamEntries,
    getExamPlan,
    getExamPlanningLabels,
    getExamPoolConfig
  } from '../exam-planning.remote'

  let { data }: PageProps = $props()

  const canEdit = $derived(data.userInfo?.hasExamPlanningPrivileges ?? false)
  const title = $derived(data.breadcrumbLabels['/planning/exam/[draftId]'])
</script>

{#snippet header()}
  <div class="space-y-2">
    <div class="flex items-center gap-3">
      <CalendarClock class="text-muted-foreground size-6" aria-hidden="true" />
      <h1 class="text-3xl font-bold tracking-tight">Prüfungsplan {title}</h1>
    </div>
    <p class="text-muted-foreground text-sm">
      {canEdit
        ? 'Prüfungen terminieren, Räume und Aufsichten zuordnen und den Stand im Semesterkalender veröffentlichen.'
        : 'Geplante Prüfungstermine mit Räumen und Aufsichten ansehen.'}
    </p>
  </div>
{/snippet}

<!--
  A reused page starts fresh for another plan, e.g. when jumping there in the browser history. The boundary is
  renewed along with it, so the switch shows its pending state instead of holding the navigation until the new
  plan's queries have loaded; the held navigation would keep resetting those queries and loop.
-->
{#key data.draftId}
  <svelte:boundary>
    <ExamPlanEditor
      draftId={data.draftId}
      holidays={data.holidays}
      semesterEntries={data.semesterEntries}
      {canEdit}
      {header}
    />
    {#snippet pending()}
      <div class="space-y-8">
        {@render header()}
        <div
          class="bg-muted/30 flex items-center justify-center gap-3 rounded-xl border px-6 py-20"
          role="status"
        >
          <Spinner class="motion-reduce:animate-none" aria-hidden="true" />
          <p class="text-muted-foreground text-sm">Prüfungsplan wird geladen …</p>
        </div>
      </div>
    {/snippet}
    {#snippet failed(error, reset)}
      <div class="space-y-8">
        {@render header()}
        <div class="space-y-4 rounded-xl border p-6" role="alert">
          <div class="space-y-1">
            <h2 class="font-semibold">Prüfungsplan nicht verfügbar</h2>
            <p class="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
          </div>
          <Button
            variant="outline"
            onclick={() => {
              void Promise.all([
                getExamPlan(data.draftId).refresh(),
                getExamPoolConfig(data.draftId).refresh(),
                getExamPlanningLabels().refresh(),
                getExamEntries(data.draftId).refresh()
              ]).catch(() => {})
              reset()
            }}>Erneut versuchen</Button
          >
        </div>
      </div>
    {/snippet}
  </svelte:boundary>
{/key}
