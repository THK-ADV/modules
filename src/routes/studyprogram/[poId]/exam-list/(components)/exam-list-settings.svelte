<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import type { Semester } from '$lib/schemas/semester'
  import { fmtSemester } from '$lib/formats'
  import { cn } from '$lib/utils'
  import { LoaderCircle, Settings2 } from '@lucide/svelte'
  import { untrack, type Snippet } from 'svelte'
  import DateRangePicker from './date-range-picker.svelte'
  import {
    forSemester,
    isComplete,
    type ExamListSettings,
    type ExamListState
  } from './exam-list-config.svelte'

  let {
    config,
    semesters,
    phases,
    attention,
    save
  }: {
    config: ExamListState
    semesters: Semester[]
    phases: { id: string; label: string }[]
    /** Marks the trigger, e.g. for missing standard periods. */
    attention: boolean
    /** Persists the configuration; without it the settings only apply locally. */
    save?: () => Promise<boolean>
  } = $props()

  let open = $state(false)
  /** Focused on open instead of the first control, whose focus ring would stand out. */
  let content = $state<HTMLElement | null>(null)
  let draft = $state<ExamListSettings>(untrack(() => config.settings()))

  const semesterLabel = $derived.by(() => {
    const semester = semesters.find((s) => s.id === draft.semester)
    return semester ? fmtSemester(semester) : draft.semester
  })

  function setPhase(phase: string, selected: boolean) {
    draft.examPhases = selected
      ? [...draft.examPhases, phase]
      : draft.examPhases.filter((p) => p !== phase)
  }

  let saving = $state(false)

  /** Closes only after a successful save, so a failure keeps the draft visible. */
  async function submit() {
    config.applySettings(draft)
    saving = true
    if (!save || (await save())) open = false
    saving = false
  }
</script>

{#snippet group(title: string, description: string | undefined, rows: Snippet)}
  <section class="space-y-4">
    <div class="space-y-1">
      <h3 class="text-base font-semibold">{title}</h3>
      {#if description}<p class="text-muted-foreground text-sm">{description}</p>{/if}
    </div>
    <div class="divide-y rounded-xl border">{@render rows()}</div>
  </section>
{/snippet}

{#snippet row(id: string, title: string, description: string, control: Snippet)}
  <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-1.5">
      <label for={id} class="text-sm font-medium">{title}</label>
      <p class="text-muted-foreground text-xs leading-snug">{description}</p>
    </div>
    {@render control()}
  </div>
{/snippet}

{#snippet semesterControl()}
  <Select.Root
    type="single"
    value={draft.semester}
    onValueChange={(value) => value !== draft.semester && (draft = forSemester(draft, value))}
  >
    <Select.Trigger id="exam-list-semester" class="h-9 w-full shrink-0 sm:w-52"
      >{semesterLabel}</Select.Trigger
    >
    <Select.Content>
      {#each semesters as semester (semester.id)}
        <Select.Item value={semester.id} label={fmtSemester(semester)}>
          {fmtSemester(semester)}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
{/snippet}

{#snippet genericControl()}
  <Switch id="exclude-generic" bind:checked={draft.excludeGenericModules} />
{/snippet}

{#snippet generalRows()}
  {@render row(
    'exam-list-semester',
    'Semester',
    'Semester der Prüfungsliste. Wählt die passenden Prüfungsphasen vor; ein Wechsel setzt Phasen und alle Anmeldezeiträume zurück.',
    semesterControl
  )}
  {@render row(
    'exclude-generic',
    'Generische Module ausschließen',
    'Platzhalter-Module für Wahlmodule erscheinen nicht in der Liste.',
    genericControl
  )}
{/snippet}

{#snippet phaseRows()}
  {#each phases as phase (phase.id)}
    {@const selected = draft.examPhases.includes(phase.id)}
    {@const usage = config.phaseUsage(phase.id)}
    {@const missing =
      selected && usage.exams > 0 && !isComplete(draft.registrationPeriods[phase.id])}
    <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-3">
        <Checkbox
          id="exam-list-phase-{phase.id}"
          class="mt-0.5"
          checked={selected}
          onCheckedChange={(checked) => setPhase(phase.id, checked)}
        />
        <div class="space-y-1.5">
          <label for="exam-list-phase-{phase.id}" class="text-sm font-medium">{phase.label}</label>
          <p
            class={cn(
              'text-xs leading-snug',
              missing ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {usage.modules}
            {usage.modules === 1 ? 'Modul' : 'Module'}
            {#if selected}
              · {missing ? 'Zeitraum fehlt für' : 'Standard für'}
              {usage.exams}
              {usage.exams === 1 ? 'Prüfung' : 'Prüfungen'}
            {/if}
          </p>
        </div>
      </div>
      {#if selected}
        <DateRangePicker
          range={draft.registrationPeriods[phase.id]}
          invalid={missing}
          class="h-9 w-full shrink-0 sm:w-60"
          onchange={(range) => (draft.registrationPeriods[phase.id] = range)}
        />
      {/if}
    </div>
  {/each}
{/snippet}

<Dialog.Root bind:open onOpenChange={(o) => o && (draft = config.settings())}>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" class="relative">
        <Settings2 />
        Einstellungen
        {#if attention}
          <span class="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500">
            <span class="sr-only">Standard-Anmeldezeiträume fehlen</span>
          </span>
        {/if}
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content
    class="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl"
    bind:ref={content}
    onOpenAutoFocus={(e) => {
      e.preventDefault()
      content?.focus()
    }}
  >
    <Dialog.Header class="border-b py-4 pr-12 pl-6">
      <Dialog.Title>Einstellungen</Dialog.Title>
      <Dialog.Description>Gelten für alle Module der Prüfungsliste.</Dialog.Description>
    </Dialog.Header>
    <div class="space-y-8 overflow-y-auto px-6 py-6">
      {@render group('Allgemein', undefined, generalRows)}
      {@render group(
        'Prüfungsphasen und Anmeldezeiträume',
        'Legt die Prüfungsphasen und ihre Standard-Anmeldezeiträume fest. Berücksichtigt werden nur Module, die eine Prüfung in einer gewählten Phase anbieten.',
        phaseRows
      )}
    </div>
    <Dialog.Footer class="gap-2 border-t px-6 py-4">
      <Button variant="outline" onclick={() => (open = false)}>Abbrechen</Button>
      <Button onclick={submit} disabled={saving}>
        {#if saving}<LoaderCircle class="animate-spin" />{/if}
        {save ? 'Speichern' : 'Übernehmen'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
