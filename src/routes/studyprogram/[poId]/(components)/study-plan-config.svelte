<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import type { ModuleCatalogModuleOption } from '$lib/schemas/module-catalog'
  import { Info, Plus, Trash2, X } from '@lucide/svelte'
  import { slide } from 'svelte/transition'
  import {
    earliestSemester,
    isGenericModule,
    type CatalogConfig,
    type GenericOccurrencePlan
  } from './catalog-config.svelte'

  let { config }: { config: CatalogConfig } = $props()

  const placeableGenericModules = $derived(
    config.options.modules
      .filter(
        (module) =>
          isGenericModule(module) && module.mandatory && !config.isModuleExcluded(module.id)
      )
      .sort((a, b) => a.title.localeCompare(b.title))
  )

  const hasSpecializations = $derived(config.options.specializations.length > 0)

  const maxSemester = $derived(
    Math.max(7, ...config.options.modules.flatMap((module) => module.recommendedSemesters))
  )

  const semesterRange = $derived(Array.from({ length: maxSemester }, (_, i) => i + 1))

  const distributableModules = $derived(
    config.options.modules
      .filter(
        (module) =>
          !isGenericModule(module) &&
          module.mandatory &&
          !config.isModuleExcluded(module.id) &&
          module.recommendedSemestersPartTime.length > 0
      )
      .sort(
        (a, b) =>
          Math.min(...a.recommendedSemestersPartTime) -
            Math.min(...b.recommendedSemestersPartTime) || a.title.localeCompare(b.title, 'de')
      )
  )

  const availableModules = $derived(
    distributableModules.filter((module) => config.distributionsOf(module.id).length === 0)
  )

  const distributedModules = $derived(
    distributableModules.filter((module) => config.distributionsOf(module.id).length > 0)
  )

  // reset after each pick, otherwise the same module cannot be selected twice in a row
  let pendingModuleId = $state('')

  function clampCount(value: number): number {
    if (!Number.isFinite(value) || value < 1) {
      return 1
    }
    return Math.min(Math.trunc(value), 20)
  }
</script>

{#snippet planPlacements(
  module: ModuleCatalogModuleOption,
  plan: GenericOccurrencePlan,
  label: string,
  emptyHint: string
)}
  {@const semesters = config.semestersOf(module, plan)}
  {@const occurrences = config.occurrencesOf(module.id, plan)}
  {@const fallback = earliestSemester(semesters)}
  <div class="space-y-3 p-4">
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
      {#if occurrences.length > 0}
        <span class="size-1.5 rounded-full bg-blue-500" title="Platzierung angepasst"></span>
      {/if}
    </div>

    {#if semesters.length === 0}
      <p class="text-muted-foreground text-sm">{emptyHint}</p>
    {:else if occurrences.length === 0}
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span class="text-muted-foreground text-sm">
          Standard: 1× im {fallback}. Semester
        </span>
        <Button variant="outline" size="sm" onclick={() => config.addOccurrence(module, plan)}>
          <Plus />
          Platzierung hinzufügen
        </Button>
      </div>
    {:else}
      <p class="text-muted-foreground text-sm">
        Ersetzt die Standard-Platzierung (1× im {fallback}. Semester).
      </p>
      <div class="space-y-2">
        {#each occurrences as occurrence (occurrence.id)}
          <div class="flex flex-wrap items-center gap-2" transition:slide={{ duration: 150 }}>
            {#if plan === 'alternative'}
              <div class="flex items-center gap-1.5">
                <Input
                  type="number"
                  min="1"
                  class="h-8 w-20 text-sm"
                  value={occurrence.semester}
                  aria-label="{label}: Semester der Platzierung"
                  onchange={(e) => {
                    const semester = Math.max(1, Math.trunc(Number(e.currentTarget.value)) || 1)
                    e.currentTarget.value = String(semester)
                    config.updateOccurrence(module.id, occurrence.id, { semester }, plan)
                  }}
                />
                <span class="text-muted-foreground text-sm">. Semester</span>
              </div>
            {:else}
              <Select.Root
                type="single"
                value={String(occurrence.semester)}
                onValueChange={(value) =>
                  config.updateOccurrence(
                    module.id,
                    occurrence.id,
                    { semester: Number(value) },
                    plan
                  )}
              >
                <Select.Trigger
                  class="h-8 w-36 text-sm"
                  aria-label="{label}: Semester der Platzierung"
                >
                  {occurrence.semester}. Semester
                </Select.Trigger>
                <Select.Content>
                  {#each semesters as semester (semester)}
                    <Select.Item value={String(semester)} label="{semester}. Semester">
                      {semester}. Semester
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            {/if}
            <div class="flex items-center gap-1.5">
              <Input
                type="number"
                min="1"
                max="20"
                class="h-8 w-20 text-sm"
                value={occurrence.count}
                aria-label="{label}: Anzahl der Platzierungen"
                onchange={(e) => {
                  const count = clampCount(Number(e.currentTarget.value))
                  e.currentTarget.value = String(count)
                  config.updateOccurrence(module.id, occurrence.id, { count }, plan)
                }}
              />
              <span class="text-muted-foreground text-sm">×</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive size-8"
              aria-label="{label}: Platzierung entfernen"
              onclick={() => config.removeOccurrence(module.id, occurrence.id, plan)}
            >
              <Trash2 />
            </Button>
          </div>
        {/each}
        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground"
          onclick={() => config.addOccurrence(module, plan)}
        >
          <Plus />
          Weitere Platzierung
        </Button>
      </div>
    {/if}
  </div>
{/snippet}

<div class="space-y-8">
  {#if placeableGenericModules.length > 0}
    <div class="space-y-4">
      <div class="space-y-1">
        <h5 class="font-medium">Platzierung generischer Platzhalter-Module</h5>
        <p class="text-muted-foreground text-sm">
          Generische Platzhalter-Module werden standardmäßig einmal im Studienverlaufsplan
          platziert. Hier lassen sich zusätzliche Platzierungen anlegen, wenn dasselbe Modul
          mehrfach oder in mehreren Semestern belegt werden soll – getrennt für den Vollzeit- und
          den Teilzeit-Studienverlaufsplan.
        </p>
      </div>

      <div class="space-y-2">
        {#each placeableGenericModules as module (module.id)}
          <div class="overflow-hidden rounded-lg border">
            <div class="bg-muted/30 border-b px-4 py-3">
              <span class="text-sm font-medium">{module.title}</span>
              <span class="text-muted-foreground ml-2 text-xs">{module.abbrev}</span>
            </div>
            <div class="divide-y sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {@render planPlacements(
                module,
                'default',
                'Vollzeit',
                'Kein empfohlenes Studiensemester hinterlegt.'
              )}
              {@render planPlacements(
                module,
                'alternative',
                'Teilzeit',
                'Kein empfohlenes Teilzeit-Semester am Modul hinterlegt.'
              )}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if distributableModules.length > 0}
    <div class="space-y-4">
      <div class="space-y-1">
        <h5 class="font-medium">Aufteilung von Modulen im Teilzeit-Studienverlaufsplan</h5>
        <p class="text-muted-foreground text-sm">
          Wählen Sie ein Pflichtmodul, um dessen ECTS im Teilzeitplan auf mehrere Semester
          aufzuteilen. Die Punkte werden gleichmäßig verteilt.
        </p>
      </div>

      {#if availableModules.length > 0}
        <Select.Root
          type="single"
          bind:value={pendingModuleId}
          onValueChange={(id) => {
            config.addDistribution(id)
            pendingModuleId = ''
          }}
        >
          <Select.Trigger class="text-muted-foreground h-9 max-w-lg text-sm">
            Modul auswählen…
          </Select.Trigger>
          <Select.Content>
            {#each availableModules as module (module.id)}
              <Select.Item value={module.id} label={module.title}>
                {module.title}
                <span class="text-muted-foreground ml-2 text-xs">
                  {module.abbrev} · {module.ects.toLocaleString('de-DE')} ECTS
                </span>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      {:else}
        <p class="text-muted-foreground text-sm">Alle geeigneten Module sind bereits aufgeteilt.</p>
      {/if}

      {#each distributedModules as module (module.id)}
        {@const semesters = config.distributionsOf(module.id)}
        {@const ectsShare = (module.ects / semesters.length).toLocaleString('de-DE')}
        <div class="overflow-hidden rounded-lg border" transition:slide={{ duration: 150 }}>
          <div class="bg-muted/30 flex items-start justify-between gap-3 border-b px-4 py-3">
            <div class="min-w-0">
              <div class="truncate text-sm font-medium">{module.title}</div>
              <div class="text-muted-foreground text-xs">
                {module.abbrev} · {module.ects.toLocaleString('de-DE')} ECTS gesamt
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive size-8 shrink-0"
              aria-label="Aufteilung von {module.title} entfernen"
              onclick={() => config.removeDistribution(module.id)}
            >
              <Trash2 />
            </Button>
          </div>
          <div class="space-y-3 p-4">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              {#each semesters as semester, index (index)}
                <div class="flex items-center gap-1">
                  <Input
                    type="number"
                    min="1"
                    class="h-8 w-20 text-sm tabular-nums"
                    value={semester}
                    aria-label="Semester {index + 1} der Aufteilung von {module.title}"
                    onchange={(e) => {
                      config.updateDistributionSemester(
                        module.id,
                        index,
                        Number(e.currentTarget.value)
                      )
                      e.currentTarget.value = String(config.distributionsOf(module.id)[index])
                    }}
                  />
                  <span class="text-muted-foreground text-sm">. Sem.</span>
                  {#if semesters.length > 2}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground hover:text-destructive size-7"
                      aria-label="Semester aus der Aufteilung entfernen"
                      onclick={() => config.removeDistributionSemester(module.id, index)}
                    >
                      <X />
                    </Button>
                  {/if}
                </div>
              {/each}
              <Button
                variant="ghost"
                size="sm"
                class="text-muted-foreground h-8"
                onclick={() => config.addDistributionSemester(module.id)}
              >
                <Plus />
                Semester
              </Button>
            </div>
            <p class="text-muted-foreground text-sm tabular-nums">{ectsShare} ECTS je Semester</p>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="space-y-4">
    <div class="space-y-1">
      <h5 class="font-medium">Abschnitte im Studienverlaufsplan</h5>
      {#if hasSpecializations}
        <p class="text-muted-foreground text-sm">
          Gliederung des Studienverlaufsplans in benannte Abschnitte.
        </p>
      {:else}
        <p class="text-muted-foreground text-sm">
          Der Studienverlaufsplan kann optional in benannte Abschnitte gegliedert werden. Ein
          Abschnitt umfasst alle Module bis einschließlich des angegebenen Semesters. Ohne
          Abschnitte wird eine durchgehende Tabelle erzeugt.
        </p>
      {/if}
    </div>

    {#if hasSpecializations}
      <div class="bg-muted/40 flex gap-3 rounded-lg border px-4 py-3">
        <Info class="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div class="space-y-2">
          <p class="text-sm">
            Diese Prüfungsordnung hat Schwerpunkte. Der Studienplan wird automatisch in Basisstudium
            und Schwerpunkt-Tabellen getrennt, manuelle Abschnitte sind deshalb nicht verfügbar.
          </p>
          <div class="flex flex-wrap gap-1">
            {#each config.options.specializations as specialization (specialization.id)}
              <Badge variant="outline" class="rounded-sm font-normal">
                {specialization.label}
              </Badge>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="space-y-2">
        {#each config.sections as section (section.id)}
          <div class="flex flex-wrap items-center gap-2" transition:slide={{ duration: 150 }}>
            <Input
              type="text"
              placeholder="Überschrift, z.B. Grundlagen"
              class="h-9 w-full max-w-sm"
              bind:value={section.headline}
              aria-label="Überschrift des Abschnitts"
            />
            <span class="text-muted-foreground text-sm">bis</span>
            <Select.Root
              type="single"
              value={String(section.untilSemester)}
              onValueChange={(value) => (section.untilSemester = Number(value))}
            >
              <Select.Trigger class="h-9 w-36 text-sm" aria-label="Abschnitt bis Semester">
                {section.untilSemester}. Semester
              </Select.Trigger>
              <Select.Content>
                {#each semesterRange as semester (semester)}
                  <Select.Item value={String(semester)} label="{semester}. Semester">
                    {semester}. Semester
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            <Button
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive size-9"
              aria-label="Abschnitt entfernen"
              onclick={() => config.removeSection(section.id)}
            >
              <Trash2 />
            </Button>
            {#if section.headline.trim().length === 0}
              <span class="text-sm text-amber-600 dark:text-amber-500">
                Ohne Überschrift wird der Abschnitt ignoriert
              </span>
            {/if}
          </div>
        {/each}
        <Button variant="outline" size="sm" onclick={() => config.addSection()}>
          <Plus />
          Abschnitt hinzufügen
        </Button>
      </div>
    {/if}
  </div>
</div>
