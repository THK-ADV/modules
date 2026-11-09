<script lang="ts">
  import { beforeNavigate } from '$app/navigation'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'
  import { cn } from '$lib/utils'
  import { CircleCheck, Search, TriangleAlert, UserRoundCheck, X } from '@lucide/svelte'
  import type { Snippet } from 'svelte'
  import {
    getExamEntries,
    getExamPlan,
    getExamPlanningLabels,
    getExamPoolConfig,
    saveExamPoolConfig
  } from '../../exam-planning.remote'
  import { plural } from '../exam-planning'
  import ExamPoolSettings from '../exam-pool-settings.svelte'
  import RefreshButton from '../refresh-button.svelte'
  import { Invigilation } from './invigilation.svelte'
  import SelectionBar from './selection-bar.svelte'
  import InvigilationList from './invigilation-list.svelte'

  let { draftId, canEdit, header }: { draftId: string; canEdit: boolean; header: Snippet } =
    $props()

  const [, config, labels, entries] = $derived(
    await Promise.all([
      getExamPlan(draftId),
      getExamPoolConfig(draftId),
      getExamPlanningLabels(),
      getExamEntries(draftId)
    ])
  )
  const inv = new Invigilation(() => ({ draftId, config, labels, entries }))
  const status = $derived(inv.status)

  beforeNavigate((navigation) => {
    if (!inv.dirtyCount) return
    navigation.cancel()
    if (navigation.type !== 'leave' && navigation.to)
      inv.pending = { kind: 'leave', url: navigation.to.url }
  })
</script>

<div class="space-y-6">
  {@render header()}

  <section
    class="bg-muted/25 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"
    aria-label="Stand der Aufsichten"
  >
    <div class="flex items-start gap-3" role="status" aria-live="polite">
      <div
        class="bg-background flex size-10 shrink-0 items-center justify-center rounded-lg border"
      >
        {#if !status.open && !status.unknown && !status.withoutRoom && !status.overlapPersons}
          <CircleCheck class="size-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
        {:else}
          <UserRoundCheck class="text-muted-foreground size-5" aria-hidden="true" />
        {/if}
      </div>
      <div class="min-w-0 space-y-1">
        <h2 class="text-lg font-semibold tracking-tight">
          {#if !inv.rows.length}
            Noch keine Termine
          {:else if status.open}
            {plural(status.open, 'Aufsicht', 'Aufsichten')} offen
          {:else if status.unknown}
            Bedarf in {plural(status.unknown, 'Raum', 'Räumen')} unbekannt
          {:else}
            Alle Aufsichten eingeteilt
          {/if}
        </h2>
        {#if status.overlapPersons}
          <button
            type="button"
            class="text-sm text-red-700 underline-offset-4 hover:underline dark:text-red-400"
            onclick={() => (inv.view = 'overlaps')}
          >
            Überschneidungen bei {plural(status.overlapPersons, 'Person', 'Personen')}
          </button>
        {:else if status.withoutRoom}
          <p class="text-sm text-amber-700 dark:text-amber-400">
            {plural(status.withoutRoom, 'Termin', 'Termine')} ohne Raum
          </p>
        {:else}
          <p class="text-muted-foreground text-sm tabular-nums">
            {status.staffed} von {status.required} eingeteilt
          </p>
        {/if}
      </div>
    </div>
    <div class="flex shrink-0 flex-wrap gap-2">
      <!-- Unsaved staffing stays in the drafts and is shown over the reloaded appointments. -->
      <RefreshButton
        refresh={() =>
          Promise.all([getExamPoolConfig(draftId).refresh(), getExamEntries(draftId).refresh()])}
        onError={(message) => (inv.actionError = message)}
      />
      {#if canEdit}
        <ExamPoolSettings
          {config}
          phases={labels.examPhases}
          methods={labels.assessmentMethods}
          persons={labels.persons}
          candidates={labels.wmas}
          duties={new Map(inv.roster.map((p) => [p.id, p.count]))}
          save={(next) => saveExamPoolConfig({ draftId, config: next })}
        />
      {/if}
    </div>
  </section>

  {#if inv.actionError}
    <div
      class="border-destructive/30 bg-destructive/10 flex items-start gap-2 rounded-lg border p-3 text-sm"
      role="alert"
    >
      <TriangleAlert class="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p class="flex-1">{inv.actionError}</p>
      <Button
        variant="ghost"
        size="icon"
        class="size-6"
        aria-label="Fehlermeldung schließen"
        onclick={() => (inv.actionError = undefined)}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  {/if}

  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div class="relative w-full sm:max-w-md">
      <Search
        class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Prüfung, Modul, Raum oder Person …"
        class="h-9 pl-9"
        bind:value={inv.search}
        aria-label="Termine durchsuchen"
      />
    </div>
    <ToggleGroup.Root
      type="single"
      variant="outline"
      size="sm"
      bind:value={() => inv.view, (v) => v && (inv.view = v as typeof inv.view)}
      aria-label="Termine filtern"
    >
      <ToggleGroup.Item value="all" class="px-3">Alle</ToggleGroup.Item>
      <ToggleGroup.Item value="open" class="px-3">Offen</ToggleGroup.Item>
      <ToggleGroup.Item
        value="overlaps"
        class={cn('px-3', !status.overlapPersons && inv.view !== 'overlaps' && 'hidden')}
        >Überschneidungen</ToggleGroup.Item
      >
    </ToggleGroup.Root>
  </div>

  <InvigilationList {inv} {canEdit} />

  {#if canEdit && inv.rows.length}
    <SelectionBar {inv} />
  {/if}
</div>

<Dialog.Root
  open={inv.pending !== undefined}
  onOpenChange={(open) => !open && (inv.pending = undefined)}
>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Änderungen verwerfen</Dialog.Title>
      <Dialog.Description>
        {plural(inv.dirtyCount, 'Termin hat', 'Termine haben')} nicht gespeicherte Aufsichten.
        {inv.pending?.kind === 'assign'
          ? 'Die automatische Zuweisung arbeitet mit dem gespeicherten Plan. Änderungen vorher speichern oder verwerfen.'
          : 'Beim Verlassen der Seite gehen sie verloren.'}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (inv.pending = undefined)}>Weiter bearbeiten</Button>
      <Button variant="destructive" onclick={inv.discardAndContinue}>Verwerfen</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
