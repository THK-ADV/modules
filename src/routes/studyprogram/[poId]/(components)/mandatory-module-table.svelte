<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import type { ModuleCatalogModuleOption } from '$lib/schemas/module-catalog'
  import { cn } from '$lib/utils.js'
  import { Info, Search } from '@lucide/svelte'
  import { defaultSemester, isGenericModule, type CatalogConfig } from './catalog-config.svelte'

  let { config }: { config: CatalogConfig } = $props()

  let search = $state('')
  let onlyModified = $state(false)

  const specializationLabels = $derived(
    new Map(config.options.specializations.map(({ id, label }) => [id, label]))
  )

  function isModified(module: ModuleCatalogModuleOption): boolean {
    return (
      (config.isModuleExcluded(module.id) && !config.isModuleExcludedByDefault(module.id)) ||
      config.selectedSemester(module.id) !== undefined ||
      config.occurrencesOf(module.id).length > 0
    )
  }

  const mandatoryModules = $derived(
    config.options.modules
      .filter((m) => m.mandatory)
      .sort((a, b) => {
        const semA = defaultSemester(a) ?? Number.POSITIVE_INFINITY
        const semB = defaultSemester(b) ?? Number.POSITIVE_INFINITY
        if (semA !== semB) {
          return semA - semB
        }
        return a.title.localeCompare(b.title, 'de')
      })
  )

  const filteredModules = $derived.by(() => {
    const query = search.trim().toLowerCase()
    return mandatoryModules.filter((module) => {
      if (onlyModified && !isModified(module)) {
        return false
      }
      if (query.length === 0) {
        return true
      }
      return (
        module.title.toLowerCase().includes(query) || module.abbrev.toLowerCase().includes(query)
      )
    })
  })

  const mandatoryModuleCount = $derived(mandatoryModules.length)

  const includedCount = $derived(
    mandatoryModules.filter((m) => !config.isModuleExcluded(m.id)).length
  )

  const hasGenericModule = $derived(mandatoryModules.some((m) => isGenericModule(m)))

  function semesterValue(module: ModuleCatalogModuleOption): string {
    const override = config.selectedSemester(module.id)
    return override !== undefined ? String(override) : 'default'
  }

  function semesterTriggerLabel(module: ModuleCatalogModuleOption): string {
    const override = config.selectedSemester(module.id)
    if (override !== undefined) {
      return `${override}. Semester`
    }
    return `Standard (${defaultSemester(module)}. Sem.)`
  }

  function onSemesterChange(module: ModuleCatalogModuleOption, value: string) {
    config.setSelectedSemester(module.id, value === 'default' ? undefined : Number(value))
  }
</script>

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
    <label class="flex cursor-pointer items-center gap-2 text-sm">
      <Switch bind:checked={onlyModified} aria-label="Nur angepasste Module anzeigen" />
      Nur angepasste Module
    </label>
    <span class="text-muted-foreground ml-auto text-sm tabular-nums">
      {includedCount} von {mandatoryModuleCount} Pflichtmodulen enthalten
    </span>
  </div>

  {#if hasGenericModule}
    <div class="bg-muted/40 flex gap-3 rounded-lg border px-4 py-3">
      <Info class="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <p class="text-sm">
        Wird ein generisches Platzhalter-Modul abgewählt, werden auch alle seine wählbaren Optionen
        nicht im Modulhandbuch berücksichtigt. Die Optionen lassen sich einzeln im Tab "Wahlmodule"
        steuern.
      </p>
    </div>
  {/if}

  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-16">Enthalten</Table.Head>
          <Table.Head>Modul</Table.Head>
          <Table.Head class="w-20 text-right">ECTS</Table.Head>
          <Table.Head>Merkmale</Table.Head>
          <Table.Head class="w-52">Semester</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each filteredModules as module (module.id)}
          {@const excluded = config.isModuleExcluded(module.id)}
          {@const overridden = config.selectedSemester(module.id) !== undefined}
          {@const inclusionLocked = config.isModuleExcludedByDefault(module.id)}
          <Table.Row
            class={cn(
              !inclusionLocked && 'cursor-pointer',
              excluded && 'bg-muted/40',
              inclusionLocked && 'opacity-60'
            )}
            onclick={(event) => {
              if ((event.target as Element).closest('button')) {
                return
              }
              config.setModuleIncluded(module.id, excluded)
            }}
          >
            <Table.Cell>
              <Checkbox
                checked={!excluded}
                onCheckedChange={(checked) => config.setModuleIncluded(module.id, checked)}
                disabled={inclusionLocked}
                title={inclusionLocked
                  ? 'Dieses Modul ist standardmäßig nicht im Katalog enthalten'
                  : undefined}
                aria-label="{module.title} im Modulhandbuch"
              />
            </Table.Cell>
            <Table.Cell>
              <div class={cn('font-medium', excluded && 'text-muted-foreground line-through')}>
                {module.title}
              </div>
              <div class="text-muted-foreground text-xs">{module.abbrev}</div>
            </Table.Cell>
            <Table.Cell class={cn('text-right tabular-nums', excluded && 'text-muted-foreground')}>
              {module.ects.toLocaleString('de-DE')}
            </Table.Cell>
            <Table.Cell class={cn(excluded && 'text-muted-foreground')}>
              <div class="flex flex-wrap gap-1">
                {#if module.optional}
                  <Badge variant="outline" class="rounded-sm px-1.5 font-normal">Wahl</Badge>
                {/if}
                {#if isGenericModule(module)}
                  <Badge variant="outline" class="rounded-sm px-1.5 font-normal"
                    >Platzhalter-Modul</Badge
                  >
                {/if}
                {#each module.specializations as specialization (specialization)}
                  <Badge
                    variant="outline"
                    class="text-muted-foreground rounded-sm px-1.5 font-normal"
                  >
                    {specializationLabels.get(specialization) ?? specialization}
                  </Badge>
                {/each}
              </div>
            </Table.Cell>
            <Table.Cell>
              {#if module.recommendedSemesters.length === 0}
                <span
                  class="text-muted-foreground"
                  title="Nur Pflichtmodule mit empfohlenem Semester erscheinen im Studienplan"
                >
                  –
                </span>
              {:else if isGenericModule(module)}
                <span
                  class="text-muted-foreground text-sm"
                  title="Die Platzierung generischer Module wird im Abschnitt Studienplan konfiguriert"
                >
                  s. Studienverlaufsplan
                </span>
              {:else if module.recommendedSemesters.length === 1}
                <span class={cn('text-sm', excluded && 'text-muted-foreground')}>
                  {module.recommendedSemesters[0]}. Semester
                </span>
              {:else}
                <div class="flex items-center gap-2">
                  <Select.Root
                    type="single"
                    value={semesterValue(module)}
                    onValueChange={(value) => onSemesterChange(module, value)}
                    disabled={excluded}
                  >
                    <Select.Trigger
                      class="h-8 w-44 text-sm"
                      aria-label="Semester für {module.title}"
                    >
                      {semesterTriggerLabel(module)}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item
                        value="default"
                        label="Standard ({defaultSemester(module)}. Sem.)"
                      >
                        Standard ({defaultSemester(module)}. Sem.)
                      </Select.Item>
                      {#each module.recommendedSemesters as semester (semester)}
                        <Select.Item value={String(semester)} label="{semester}. Semester">
                          {semester}. Semester
                        </Select.Item>
                      {/each}
                    </Select.Content>
                  </Select.Root>
                  {#if overridden}
                    <span
                      class="size-2 shrink-0 rounded-full bg-blue-500"
                      title="Semester wurde angepasst"
                    ></span>
                  {:else if !excluded}
                    <span
                      class="size-2 shrink-0 rounded-full bg-amber-400"
                      title="Mehrere empfohlene Semester – ohne Auswahl wird das kleinste verwendet und ein Hinweis in der Vorschau angezeigt"
                    ></span>
                  {/if}
                </div>
              {/if}
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={5} class="text-muted-foreground h-24 text-center">
              {onlyModified && search.trim().length === 0
                ? 'Keine angepassten Module'
                : 'Keine Module gefunden'}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
</div>
