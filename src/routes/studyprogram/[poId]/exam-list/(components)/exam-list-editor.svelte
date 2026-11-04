<script lang="ts">
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import LoadingOverlay from '$lib/components/ui/loading-overlay/loading-overlay.svelte'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import { getErrorMessage } from '$lib/errors'
  import { fmtDate, fmtSemester } from '$lib/formats'
  import { previewExamList } from '$lib/preview-action'
  import { cn } from '$lib/utils'
  import { parseDate } from '@internationalized/date'
  import {
    Calendar1,
    CalendarDays,
    CalendarRange,
    CircleAlert,
    Check,
    CircleCheck,
    Eye,
    EyeOff,
    FileCheck,
    ListChecks,
    LoaderCircle,
    Save
  } from '@lucide/svelte'
  import { untrack, type Snippet } from 'svelte'
  import {
    getExamListConfig,
    getExamListOptions,
    publishExamList,
    saveExamListConfig
  } from '../exam-list.remote'
  import { ExamListState, isComplete, todayInBerlin } from './exam-list-config.svelte'
  import ExamListModules from './exam-list-modules.svelte'
  import ExamListSettings from './exam-list-settings.svelte'

  let { po, header }: { po: string; header: Snippet } = $props()

  const [data, stored] = $derived(
    await Promise.all([getExamListOptions(po), getExamListConfig(po)])
  )
  /** Recreated per PO only: refreshing the stored configuration, e.g. on save, keeps local edits. */
  const config = $derived(
    new ExamListState(
      data.modules,
      untrack(() => stored),
      data.semesters
    )
  )

  const labels = $derived({
    identities: new Map(
      data.labels.identities.map((i) => [
        i.id,
        'label' in i ? i.label : [i.firstname && `${i.firstname[0]}.`, i.lastname].join(' ').trim()
      ])
    ),
    assessmentMethods: new Map(data.labels.assessmentMethods.map((m) => [m.id, m.deLabel])),
    examPhases: new Map(data.labels.examPhases.map((p) => [p.id, p.label])),
    examPhaseAbbrevs: new Map(data.labels.examPhases.map((p) => [p.id, p.abbrev]))
  })
  const label = (kind: keyof typeof labels, id: string) => labels[kind].get(id) ?? id

  const semesterLabel = $derived.by(() => {
    const semester = data.semesters.find((s) => s.id === config.semester)
    return semester ? fmtSemester(semester) : config.semester
  })
  const phases = $derived(data.labels.examPhases.filter((p) => p.id !== 'none'))
  const selectedPhases = $derived(phases.filter((p) => config.examPhases.includes(p.id)))
  const standardPeriods = $derived(
    selectedPhases.filter((p) => isComplete(config.registrationPeriods[p.id])).length
  )
  /** Selected phases whose missing standard period is needed by some exam. */
  const missingStandard = $derived(
    selectedPhases.some(
      (p) => !isComplete(config.registrationPeriods[p.id]) && config.phaseUsage(p.id).exams > 0
    )
  )

  const included = $derived(data.modules.filter((m) => !config.exclusion(m)))
  const examCount = $derived(
    included.reduce(
      (n, m) => n + config.exams(m).filter((exam) => config.isExamIncluded(m, exam)).length,
      0
    )
  )
  /** Preview and publication need included modules and all their registration periods. */
  const blocked = $derived(config.missing.length > 0 || included.length === 0)
  const hasMissing = (mandatory: boolean) =>
    config.missing.some(({ module }) => module.mandatory === mandatory)

  let selectedTab = $state('mandatory')
  type Action = 'save' | 'preview' | 'publish'
  let busy = $state<Action | undefined>(undefined)
  /** The action that just succeeded, confirmed briefly on its button. */
  let done = $state<Action | undefined>(undefined)
  let publishDate = $state<string | undefined>(undefined)
  let showErrorMessage = $state<string | undefined>(undefined)

  async function run(action: Action, task: () => Promise<unknown>) {
    if (busy) return false
    busy = action
    showErrorMessage = undefined
    try {
      await task()
      done = action
      setTimeout(() => done === action && (done = undefined), 2000)
      return true
    } catch (error) {
      showErrorMessage = getErrorMessage(error)
      return false
    } finally {
      busy = undefined
    }
  }

  const save = () => run('save', () => saveExamListConfig({ po, config: config.toConfig() }))

  const preview = () => run('preview', () => previewExamList(data.studyProgram, config.toConfig()))

  function publish(date: string) {
    publishDate = undefined
    run('publish', () => publishExamList({ po, config: config.toConfig(date) }))
  }
</script>

{#snippet actionLabel(action: Action, label: string, doneLabel: string)}
  <!-- Both labels share one grid cell, so the button keeps its width when the label changes. -->
  <span class="grid justify-items-start" aria-live="polite">
    <span class={cn('col-start-1 row-start-1', done === action && 'invisible')}>{label}</span>
    <span class={cn('col-start-1 row-start-1', done !== action && 'invisible')}>{doneLabel}</span>
  </span>
{/snippet}

{#snippet tab(value: string, title: string, mandatory: boolean)}
  <Tabs.Trigger {value}>
    <span class="flex items-center gap-1.5">
      {title}
      {#if hasMissing(mandatory)}
        <span class="size-1.5 shrink-0 rounded-full bg-red-500" title="Anmeldezeiträume fehlen"
        ></span>
      {/if}
    </span>
  </Tabs.Trigger>
{/snippet}

{#snippet content(value: string, mandatory: boolean, noun: string)}
  <Tabs.Content {value} class="space-y-4 pt-2">
    <p class="text-muted-foreground max-w-3xl text-sm">
      Abgewählte Module und Prüfungen erscheinen nicht in der Prüfungsliste. Neue Module und
      Prüfungen sind automatisch enthalten. Ein Klick auf eine Phase legt einen abweichenden
      Anmeldezeitraum fest.
    </p>
    <ExamListModules
      {config}
      modules={data.modules.filter((m) => m.mandatory === mandatory)}
      {noun}
      {label}
    />
  </Tabs.Content>
{/snippet}

<LoadingOverlay show={busy === 'publish'} message="Prüfungsliste wird freigegeben…" />
<ErrorMessage bind:message={showErrorMessage} />

<div class="flex h-full min-w-0 flex-1 flex-col space-y-8">
  {@render header()}

  <section class="bg-background sticky top-2 z-30 rounded-xl">
    <div
      class="bg-muted/25 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-start gap-3" role="status" aria-live="polite">
        <div
          class="bg-background flex size-10 shrink-0 items-center justify-center rounded-lg border"
        >
          {#if blocked}
            <CircleAlert class="size-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          {:else}
            <CircleCheck class="size-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          {/if}
        </div>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold tracking-tight">
            {#if config.missing.length}
              {config.missing.length}
              {config.missing.length === 1 ? 'Anmeldezeitraum fehlt' : 'Anmeldezeiträume fehlen'}
            {:else if !included.length}
              Keine Module enthalten
            {:else}
              {examCount} Prüfungen aus {included.length} Modulen
            {/if}
          </h2>
          <ul class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <li class="flex items-center gap-1.5">
              <CalendarDays class="size-4" aria-hidden="true" />
              {semesterLabel}
            </li>
            <li
              class="flex items-center gap-1.5"
              title={selectedPhases.map((p) => p.label).join(', ')}
            >
              <ListChecks class="size-4" aria-hidden="true" />
              {selectedPhases.length}
              {selectedPhases.length === 1 ? 'Phase' : 'Phasen'}
            </li>
            <li class={cn('flex items-center gap-1.5', missingStandard && 'text-destructive')}>
              <CalendarRange class="size-4" aria-hidden="true" />
              {standardPeriods} / {selectedPhases.length} Standard-Zeiträume
            </li>
            <li class="flex items-center gap-1.5">
              <EyeOff class="size-4" aria-hidden="true" />
              {config.excludeGenericModules ? 'Ohne generische Module' : 'Mit generischen Modulen'}
            </li>
          </ul>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <ExamListSettings
          {config}
          semesters={data.semesters}
          {phases}
          attention={missingStandard}
          save={data.canCreate ? save : undefined}
        />
        {#if data.canCreate}
          <Button variant="outline" onclick={save}>
            {#if busy === 'save'}<LoaderCircle
                class="animate-spin"
              />{:else if done === 'save'}<Check
                class="text-emerald-600 dark:text-emerald-400"
              />{:else}<Save />{/if}
            {@render actionLabel('save', 'Speichern', 'Gespeichert')}
          </Button>
        {/if}
        <Button variant="outline" disabled={blocked} onclick={preview}>
          {#if busy === 'preview'}<LoaderCircle class="animate-spin" />{:else}<Eye />{/if}
          Vorschau
        </Button>
        {#if data.canCreate}
          <Button disabled={blocked} onclick={() => (publishDate = todayInBerlin())}>
            {#if busy === 'publish'}<LoaderCircle
                class="animate-spin"
              />{:else if done === 'publish'}<Check />{:else}<FileCheck />{/if}
            {@render actionLabel('publish', 'Freigeben', 'Freigegeben')}
          </Button>
        {/if}
      </div>
    </div>
  </section>

  <Tabs.Root bind:value={selectedTab}>
    <Tabs.List class="h-auto max-w-full flex-wrap justify-start">
      {@render tab('mandatory', 'Pflichtmodule', true)}
      {@render tab('elective', 'Wahlmodule', false)}
    </Tabs.List>
    {@render content('mandatory', true, 'Pflichtmodulen')}
    {@render content('elective', false, 'Wahlmodulen')}
  </Tabs.Root>
</div>

<Dialog.Root
  open={publishDate !== undefined}
  onOpenChange={(open) => !open && (publishDate = undefined)}
>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Prüfungsliste freigeben</Dialog.Title>
      <Dialog.Description>
        Die Prüfungsliste für {semesterLabel} wird mit {examCount} Prüfungen aus
        {included.length} Modulen öffentlich freigegeben. Eine bestehende Liste dieses Semesters wird
        ersetzt. Die Konfiguration wird dabei nicht gespeichert.
      </Dialog.Description>
    </Dialog.Header>
    {#if publishDate}
      <div class="space-y-2">
        <Label for="exam-list-publish-date">Freigabedatum</Label>
        <Popover.Root>
          <Popover.Trigger id="exam-list-publish-date">
            {#snippet child({ props })}
              <Button {...props} variant="outline" class="w-full justify-start font-normal">
                <Calendar1 />
                {fmtDate(publishDate!)}
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content class="w-auto p-0" align="start">
            <Calendar
              type="single"
              locale="de-DE"
              value={parseDate(publishDate)}
              onValueChange={(value) => value && (publishDate = value.toString())}
            />
          </Popover.Content>
        </Popover.Root>
        <p class="text-muted-foreground text-xs">Erscheint als Freigabedatum auf der PDF.</p>
      </div>
    {/if}
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (publishDate = undefined)}>Abbrechen</Button>
      <Button onclick={() => publish(publishDate!)}>Freigeben</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
