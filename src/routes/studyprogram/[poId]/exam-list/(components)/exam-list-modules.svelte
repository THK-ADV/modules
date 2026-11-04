<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import type { DateRange, ExamListModuleOption } from '$lib/schemas/exam-list'
  import { cn } from '$lib/utils'
  import { CopyCheck, CornerDownRight, RotateCcw, Search } from '@lucide/svelte'
  import { type Exam, type ExamListState, type Exclusion } from './exam-list-config.svelte'
  import DateRangePicker from './date-range-picker.svelte'

  type LabelKind = 'identities' | 'assessmentMethods' | 'examPhases' | 'examPhaseAbbrevs'

  let {
    config,
    modules,
    noun,
    label
  }: {
    config: ExamListState
    modules: ExamListModuleOption[]
    /** Dative plural of the module kind, e.g. "Pflichtmodulen". */
    noun: string
    label: (kind: LabelKind, id: string) => string
  } = $props()

  const exclusions: Record<Exclusion, string> = {
    generic: 'Generisch',
    manual: 'Ausgeschlossen',
    phases: 'Keine gewählte Phase',
    exams: 'Alle Prüfungen ausgeschlossen'
  }

  const chip = {
    default: 'text-muted-foreground',
    changed:
      'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300',
    missing:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300'
  }

  let search = $state('')

  const visible = $derived.by(() => {
    const query = search.trim().toLowerCase()
    return modules
      .filter(
        (m) => m.title.toLowerCase().includes(query) || m.abbrev.toLowerCase().includes(query)
      )
      .sort((a, b) => a.semester - b.semester || a.title.localeCompare(b.title, 'de'))
  })

  const includedCount = $derived(modules.filter((m) => !config.exclusion(m)).length)

  const fmtDay = (date: string) => date.split('-').reverse().join('.')
  const fmtRange = (range: DateRange) => `${fmtDay(range.start!)} – ${fmtDay(range.end!)}`
  const methods = (m: ExamListModuleOption) =>
    m.assessmentMethods
      .map(
        ({ method, percentage }) =>
          label('assessmentMethods', method) + (percentage === null ? '' : ` (${percentage} %)`)
      )
      .join(', ') || 'Keine Prüfungsform'

  /** Toggles on row clicks outside of buttons, which handle their own clicks. */
  const onRowClick = (toggle: () => void) => (event: MouseEvent) => {
    if (!(event.target as Element).closest('button')) toggle()
  }
</script>

{#snippet periods(m: ExamListModuleOption, exam: Exam)}
  <div class="flex flex-wrap gap-1.5">
    {#each config.phases(m) as phase (phase)}
      {@const override = config.override(m, exam, phase)}
      {@const state = config.isMissing(m, exam, phase)
        ? 'missing'
        : override
          ? 'changed'
          : 'default'}
      <DateRangePicker
        range={config.period(m, exam, phase)}
        onchange={(range) => config.setOverride(m, exam, phase, range)}
      >
        {#snippet trigger(props)}
          <button
            {...props}
            type="button"
            class={cn(
              'focus-visible:ring-ring/50 inline-flex items-center rounded-md border px-2 py-0.5 text-xs whitespace-nowrap focus-visible:ring-[3px] focus-visible:outline-none',
              chip[state]
            )}
            title={label('examPhases', phase)}
          >
            {label('examPhaseAbbrevs', phase)} · {state === 'missing'
              ? 'fehlt'
              : override
                ? fmtRange(override)
                : 'Standard'}
          </button>
        {/snippet}
        {#snippet actions(close)}
          {#if override}
            <Button
              variant="ghost"
              size="sm"
              onclick={() => {
                config.setOverride(m, exam, phase, undefined)
                close()
              }}
            >
              <RotateCcw />
              Standard verwenden
            </Button>
            {#if config.exams(m).length > 1}
              <Button
                variant="ghost"
                size="sm"
                onclick={() => {
                  config.applyToAllExams(m, exam, phase)
                  close()
                }}
              >
                <CopyCheck />
                Für alle Prüfungen
              </Button>
            {/if}
          {/if}
        {/snippet}
      </DateRangePicker>
    {/each}
  </div>
{/snippet}

<div class="space-y-4">
  <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
    <div class="relative w-full max-w-xs">
      <Search
        class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <Input
        type="search"
        placeholder="Modul suchen…"
        class="h-9 pl-9"
        bind:value={search}
        aria-label="Module durchsuchen"
      />
    </div>
    <span class="text-muted-foreground ml-auto text-sm tabular-nums">
      {includedCount} von {modules.length}
      {noun} enthalten
    </span>
  </div>

  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-16">Enthalten</Table.Head>
          <Table.Head>Modul</Table.Head>
          <Table.Head class="hidden md:table-cell">Prüfer</Table.Head>
          <Table.Head>Anmeldezeiträume</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each visible as m (m.id)}
          {@const exclusion = config.exclusion(m)}
          {@const locked = exclusion === 'generic' || exclusion === 'phases'}
          {@const named = m.isGeneric ? undefined : m.examNames}
          <Table.Row
            class={cn(!locked && 'cursor-pointer', exclusion && 'bg-muted/40')}
            onclick={onRowClick(
              () => !locked && config.setModuleIncluded(m, config.excludedModules.has(m.id))
            )}
          >
            <Table.Cell class="align-top">
              <Checkbox
                checked={!locked && !config.excludedModules.has(m.id)}
                disabled={locked}
                onCheckedChange={(checked) => config.setModuleIncluded(m, checked)}
                aria-label="{m.title} in die Prüfungsliste aufnehmen"
              />
            </Table.Cell>
            <Table.Cell class="align-top whitespace-normal">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  class={cn(
                    'font-medium',
                    exclusion && 'text-muted-foreground',
                    exclusion === 'manual' && 'line-through'
                  )}
                >
                  {m.title}
                </span>
                {#if exclusion}
                  <Badge
                    variant="outline"
                    class="border-amber-200 bg-amber-50 font-normal text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300"
                  >
                    {exclusions[exclusion]}
                  </Badge>
                {/if}
              </div>
              <div class="text-muted-foreground text-xs">
                {methods(m)}{#if named}&nbsp;· {named.length}
                  {named.length === 1 ? 'Prüfung' : 'Prüfungen'}{/if}
              </div>
              <div class="text-muted-foreground text-xs md:hidden">
                Erstprüfer {label('identities', m.firstExaminer)} · Zweitprüfer
                {label('identities', m.secondExaminer)}
              </div>
            </Table.Cell>
            <Table.Cell class="hidden align-top md:table-cell">
              <div class="font-medium" title="Erstprüfer">
                <span class="sr-only">Erstprüfer</span>
                {label('identities', m.firstExaminer)}
              </div>
              <div class="text-muted-foreground text-xs" title="Zweitprüfer">
                <span class="sr-only">Zweitprüfer</span>
                {label('identities', m.secondExaminer)}
              </div>
            </Table.Cell>
            <Table.Cell class="align-top whitespace-normal">
              {#if m.isGeneric}
                <span
                  class="text-muted-foreground text-xs"
                  title="Generische Module haben keine Anmeldezeiträume"
                >
                  {config
                    .phases(m)
                    .map((p) => label('examPhaseAbbrevs', p))
                    .join(', ') || '—'}
                </span>
              {:else if !exclusion && !named}
                {@render periods(m, null)}
              {/if}
            </Table.Cell>
          </Table.Row>
          {#if named && (!exclusion || exclusion === 'exams')}
            {#each named as exam (exam)}
              {@const included = config.isExamIncluded(m, exam)}
              <Table.Row
                class={cn('cursor-pointer', !included && 'bg-muted/40')}
                onclick={onRowClick(() => config.setExamIncluded(m, exam, !included))}
              >
                <Table.Cell></Table.Cell>
                <Table.Cell class="align-top whitespace-normal">
                  <div class="flex items-center gap-2">
                    <CornerDownRight
                      class="text-muted-foreground size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <Checkbox
                      checked={included}
                      onCheckedChange={(checked) => config.setExamIncluded(m, exam, checked)}
                      aria-label="Prüfung {exam} aufnehmen"
                    />
                    <span class="text-sm">
                      <span class="text-muted-foreground">Prüfung</span>
                      <span class={cn(!included && 'text-muted-foreground line-through')}
                        >{exam}</span
                      >
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell class="hidden md:table-cell"></Table.Cell>
                <Table.Cell class="align-top whitespace-normal">
                  {#if included}{@render periods(m, exam)}{/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          {/if}
        {:else}
          <Table.Row>
            <Table.Cell colspan={4} class="text-muted-foreground h-24 text-center">
              Keine Module gefunden
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
