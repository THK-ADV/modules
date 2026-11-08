<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import type { ExamPoolConfig } from '$lib/schemas/exam-planning'
  import { getErrorMessage } from '$lib/errors'
  import { cn } from '$lib/utils'
  import { LoaderCircle, Settings2, X } from '@lucide/svelte'
  import type { Snippet } from 'svelte'
  import { plural, stateBadge, type PlanningLabels } from './exam-planning'
  import OptionPicker from './option-picker.svelte'

  let {
    config,
    phases,
    methods,
    persons,
    duties,
    save
  }: {
    config: ExamPoolConfig
    phases: { id: string; label: string; abbrev: string }[]
    methods: { id: string; deLabel: string }[]
    persons: PlanningLabels['persons']
    /** Saved invigilations per person over all appointments of the plan. */
    duties: Map<string, number>
    /** Persists the configuration; a rejection keeps the dialog open with the error. */
    save: (config: ExamPoolConfig) => Promise<unknown>
  } = $props()

  let open = $state(false)
  let content = $state<HTMLElement | null>(null)
  let draft = $state<ExamPoolConfig>({
    semester: '',
    phases: [],
    assessmentMethods: [],
    availableInvigilators: []
  })
  let saving = $state(false)
  let error = $state<string>()

  const personById = $derived(new Map(persons.map((p) => [p.id, p])))
  const dutiesHint = (id: string) =>
    plural(duties.get(id) ?? 0, 'Aufsicht im Plan', 'Aufsichten im Plan')
  /** Active persons, preceded by selected ones that are inactive or missing in the core data. */
  const invigilatorOptions = $derived([
    ...draft.availableInvigilators
      .filter((id) => !personById.get(id)?.isActive)
      .map((id) => {
        const p = personById.get(id)
        return {
          id,
          label: p ? `${p.lastname}, ${p.firstname}` : id,
          hint: `Nicht aktiv, ${dutiesHint(id)}`
        }
      }),
    ...persons
      .filter((p) => p.isActive)
      .map((p) => ({
        id: p.id,
        label: `${p.lastname}, ${p.firstname}`,
        hint: dutiesHint(p.id),
        keywords: [p.abbreviation]
      }))
  ])
  const selectedInvigilators = $derived(
    draft.availableInvigilators
      .map((id) => {
        const p = personById.get(id)
        return {
          id,
          label: p ? `${p.lastname}, ${p.firstname}` : id,
          active: p?.isActive ?? false,
          hint: dutiesHint(id)
        }
      })
      .toSorted((a, b) => a.label.localeCompare(b.label, 'de'))
  )
  const activeCount = $derived(selectedInvigilators.filter((p) => p.active).length)
  const inactiveCount = $derived(selectedInvigilators.length - activeCount)

  /** Whether the saved configuration lets the automatic assignment choose anyone. */
  const savedActive = $derived(
    config.availableInvigilators.some((id) => personById.get(id)?.isActive)
  )

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

  /** Closes only after a successful save, so a failure keeps the draft visible. */
  async function submit() {
    if (saving) return
    saving = true
    error = undefined
    const next = $state.snapshot(draft)
    next.availableInvigilators = [...new Set(next.availableInvigilators)].sort()
    try {
      await save(next)
      open = false
    } catch (e) {
      error = getErrorMessage(e)
    } finally {
      saving = false
    }
  }
</script>

{#snippet invigilatorControl()}
  <OptionPicker
    id="exam-pool-invigilators"
    class="w-full shrink-0 sm:w-60"
    multiple
    options={invigilatorOptions}
    selected={draft.availableInvigilators}
    onSelect={(id) => (draft.availableInvigilators = toggle(draft.availableInvigilators, id))}
    label={draft.availableInvigilators.length
      ? plural(draft.availableInvigilators.length, 'Person', 'Personen')
      : 'Keine Personen'}
  />
{/snippet}

{#snippet invigilatorRows()}
  <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-1.5">
      <label for="exam-pool-invigilators" class="text-sm font-medium">
        Verfügbare Aufsichtspersonen
      </label>
      <p class="text-muted-foreground text-xs leading-snug">
        Die automatische Einteilung wählt nur aktive Personen dieser Auswahl. Entfernte Personen
        behalten ihre bisherigen Aufsichten.
      </p>
      <p
        class={cn(
          'text-xs leading-snug',
          activeCount ? 'text-muted-foreground' : 'text-red-700 dark:text-red-400'
        )}
      >
        {#if !draft.availableInvigilators.length}
          Keine Person ausgewählt: Die automatische Einteilung ergänzt niemanden.
        {:else if !activeCount}
          Keine aktive Person ausgewählt: Die automatische Einteilung ergänzt niemanden.
        {:else}
          {plural(activeCount, 'aktive Person', 'aktive Personen')} für die automatische Einteilung{inactiveCount
            ? `, ${inactiveCount} nicht aktiv`
            : ''}
        {/if}
      </p>
    </div>
    {@render invigilatorControl()}
  </div>
  {#if draft.availableInvigilators.length}
    <ul class="flex flex-wrap gap-1.5 p-4" aria-label="Ausgewählte Aufsichtspersonen">
      {#each selectedInvigilators as person (person.id)}
        <li>
          <Badge
            variant="outline"
            class={cn('gap-1 py-0.5 pr-0.5 font-normal', !person.active && stateBadge.warning)}
            title={person.hint}
          >
            {person.label}{person.active ? '' : ' (nicht aktiv)'}
            <button
              type="button"
              class="hover:bg-muted focus-visible:ring-ring rounded-sm p-0.5 focus-visible:ring-2 focus-visible:outline-none"
              aria-label="{person.label} entfernen"
              onclick={() =>
                (draft.availableInvigilators = toggle(draft.availableInvigilators, person.id))}
            >
              <X class="size-3" aria-hidden="true" />
            </button>
          </Badge>
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

{#snippet group(title: string, description: string, rows: Snippet)}
  <section class="space-y-4">
    <div class="space-y-1">
      <h3 class="text-base font-semibold">{title}</h3>
      <p class="text-muted-foreground text-sm">{description}</p>
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

{#snippet phaseControl()}
  <Select.Root type="multiple" bind:value={draft.phases}>
    <Select.Trigger id="exam-pool-phases" class="h-9 w-full shrink-0 sm:w-60">
      <span class="truncate">
        {draft.phases.length
          ? phases
              .filter((p) => draft.phases.includes(p.id))
              .map((p) => p.abbrev)
              .join(', ')
          : 'Alle Phasen'}
      </span>
    </Select.Trigger>
    <Select.Content>
      {#each phases as phase (phase.id)}
        <Select.Item value={phase.id} label={phase.label}>{phase.label}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
{/snippet}

{#snippet methodControl()}
  <OptionPicker
    id="exam-pool-methods"
    class="w-full shrink-0 sm:w-60"
    multiple
    options={methods.map((m) => ({ id: m.id, label: m.deLabel }))}
    selected={draft.assessmentMethods}
    onSelect={(id) => (draft.assessmentMethods = toggle(draft.assessmentMethods, id))}
    label={draft.assessmentMethods.length
      ? plural(draft.assessmentMethods.length, 'Prüfungsform', 'Prüfungsformen')
      : 'Alle Prüfungsformen'}
  />
{/snippet}

{#snippet selectionRows()}
  {@render row(
    'exam-pool-phases',
    'Prüfungsphasen',
    'Angeboten werden Prüfungen dieser Phasen. Ohne Auswahl sind alle Phasen enthalten.',
    phaseControl
  )}
  {@render row(
    'exam-pool-methods',
    'Prüfungsformen',
    'Angeboten werden Prüfungen mit mindestens einer dieser Formen. Ohne Auswahl sind alle Formen enthalten.',
    methodControl
  )}
{/snippet}

<Dialog.Root
  bind:open
  onOpenChange={(o) => {
    if (!o) return
    draft = structuredClone($state.snapshot(config))
    error = undefined
  }}
>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" class="relative">
        <Settings2 aria-hidden="true" />
        Einstellungen
        {#if !savedActive}
          <span class="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-600 dark:bg-red-500"
          ></span>
          <span class="sr-only">: keine aktiven Aufsichtspersonen ausgewählt</span>
        {/if}
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content
    class="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-3xl"
    bind:ref={content}
    onOpenAutoFocus={(e) => {
      e.preventDefault()
      content?.focus()
    }}
  >
    <Dialog.Header class="border-b px-6 py-4 pr-12">
      <Dialog.Title>Einstellungen</Dialog.Title>
      <Dialog.Description>
        Gelten für alle, die diesen Prüfungsplan bearbeiten. Bereits geplante Termine bleiben
        unverändert.
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-8 overflow-y-auto px-6 py-6">
      {@render group(
        'Prüfungsphasen und Prüfungsformen',
        'Bestimmen, welche Prüfungen aus den veröffentlichten Prüfungslisten zur Planung angeboten werden.',
        selectionRows
      )}
      {@render group(
        'Aufsichtspersonen',
        'Bestimmen, wen „Automatisch ergänzen“ für offene Aufsichten einteilen darf. Von Hand lässt sich weiterhin jede Person einteilen. Das Speichern ändert keine Termine.',
        invigilatorRows
      )}
      {#if error}
        <p class="text-destructive text-sm" role="alert">{error}</p>
      {/if}
    </div>
    <Dialog.Footer class="gap-2 border-t px-6 py-4">
      <Button variant="outline" onclick={() => (open = false)}>Abbrechen</Button>
      <Button onclick={submit}>
        {#if saving}<LoaderCircle class="animate-spin" aria-hidden="true" />{/if}
        Speichern
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
