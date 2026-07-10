<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import type { ModuleCatalogGenericElectiveGroup } from '$lib/schemas/module-catalog'
  import { cn } from '$lib/utils.js'
  import { ChevronRight, Search } from '@lucide/svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import type { CatalogConfig } from './catalog-config.svelte'

  let { config }: { config: CatalogConfig } = $props()

  type ElectiveCandidate = ModuleCatalogGenericElectiveGroup['optionCandidates'][number]

  interface VisibleElectiveGroup extends ModuleCatalogGenericElectiveGroup {
    visibleCandidates: ElectiveCandidate[]
  }

  let search = $state('')

  const collapsedGroupIds = new SvelteSet<string>()

  const normalizedSearch = $derived(search.trim().toLocaleLowerCase('de-DE'))

  const sortedGroups = $derived.by((): ModuleCatalogGenericElectiveGroup[] =>
    config.options.genericElectiveGroups
      .map((group) => ({
        ...group,
        optionCandidates: [...group.optionCandidates].sort(compareByTitle)
      }))
      .sort(compareByTitle)
  )

  const filteredGroups = $derived.by((): VisibleElectiveGroup[] =>
    sortedGroups
      .map((group) => {
        const groupMatchesSearch = matchesSearch(group, normalizedSearch)

        return {
          ...group,
          visibleCandidates:
            normalizedSearch.length === 0 || groupMatchesSearch
              ? group.optionCandidates
              : group.optionCandidates.filter((candidate) =>
                  matchesSearch(candidate, normalizedSearch)
                )
        }
      })
      .filter((group) => group.visibleCandidates.length > 0)
  )

  const totalOptionCount = $derived(
    sortedGroups.reduce((count, group) => count + group.optionCandidates.length, 0)
  )

  const totalIncludedCount = $derived.by(() =>
    sortedGroups.reduce((count, group) => count + includedCount(group), 0)
  )

  function compareByTitle<T extends { title: string }>(a: T, b: T): number {
    return a.title.localeCompare(b.title, 'de')
  }

  function matchesSearch(item: { title: string; abbrev: string }, query: string): boolean {
    return (
      item.title.toLocaleLowerCase('de-DE').includes(query) ||
      item.abbrev.toLocaleLowerCase('de-DE').includes(query)
    )
  }

  function isGroupExpanded(groupId: string): boolean {
    return !collapsedGroupIds.has(groupId)
  }

  function toggleGroup(groupId: string) {
    if (collapsedGroupIds.has(groupId)) {
      collapsedGroupIds.delete(groupId)
    } else {
      collapsedGroupIds.add(groupId)
    }
  }

  function candidateRowsId(groupId: string): string {
    return `elective-candidates-${groupId}`
  }

  function isOptionIncluded(
    group: ModuleCatalogGenericElectiveGroup,
    candidate: ElectiveCandidate
  ): boolean {
    return (
      !config.isModuleExcluded(group.genericModuleId) &&
      !config.isModuleExcluded(candidate.moduleId) &&
      config.isElectiveOptionIncluded(group.genericModuleId, candidate.moduleId)
    )
  }

  function includedCount(group: ModuleCatalogGenericElectiveGroup): number {
    return group.optionCandidates.filter((candidate) => isOptionIncluded(group, candidate)).length
  }

  function groupSelectionState(group: ModuleCatalogGenericElectiveGroup): {
    checked: boolean
    indeterminate: boolean
    disabled: boolean
  } {
    if (config.isModuleExcluded(group.genericModuleId)) {
      return { checked: false, indeterminate: false, disabled: true }
    }

    const selectableCandidates = group.optionCandidates.filter(
      (candidate) => !config.isModuleExcluded(candidate.moduleId)
    )
    const selectedCount = selectableCandidates.filter((candidate) =>
      config.isElectiveOptionIncluded(group.genericModuleId, candidate.moduleId)
    ).length

    return {
      checked: selectableCandidates.length > 0 && selectedCount === selectableCandidates.length,
      indeterminate: selectedCount > 0 && selectedCount < selectableCandidates.length,
      disabled: selectableCandidates.length === 0
    }
  }

  function setGroupIncluded(group: ModuleCatalogGenericElectiveGroup, included: boolean) {
    for (const candidate of group.optionCandidates) {
      if (config.isModuleExcluded(candidate.moduleId)) {
        continue
      }
      config.setElectiveOptionIncluded(group.genericModuleId, candidate.moduleId, included)
    }
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
        placeholder="Wahlmodul suchen…"
        class="h-9 pl-9"
        bind:value={search}
        oninput={() => collapsedGroupIds.clear()}
        aria-label="Wahlmodule durchsuchen"
      />
    </div>
    <span class="text-muted-foreground ml-auto text-sm tabular-nums">
      {totalIncludedCount} von {totalOptionCount} Wahloptionen enthalten
    </span>
  </div>

  <div class="rounded-md border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-16">Enthalten</Table.Head>
          <Table.Head>Modul</Table.Head>
          <Table.Head class="w-20 text-right">ECTS</Table.Head>
          <Table.Head class="w-40">Zugehörigkeit</Table.Head>
        </Table.Row>
      </Table.Header>
      {#each filteredGroups as group (group.genericModuleId)}
        {@const groupExcluded = config.isModuleExcluded(group.genericModuleId)}
        {@const expanded = isGroupExpanded(group.genericModuleId)}
        {@const candidatesId = candidateRowsId(group.genericModuleId)}
        {@const groupSelection = groupSelectionState(group)}
        <Table.Body class="[&_tr:last-child]:border-b">
          <Table.Row class={cn('bg-muted/50 hover:bg-muted/50', groupExcluded && 'opacity-60')}>
            <Table.Cell>
              <Checkbox
                checked={groupSelection.checked}
                indeterminate={groupSelection.indeterminate}
                disabled={groupSelection.disabled}
                onCheckedChange={(checked) => setGroupIncluded(group, checked)}
                title={groupSelection.checked
                  ? `Alle verfügbaren Wahloptionen für ${group.title} abwählen`
                  : `Alle verfügbaren Wahloptionen für ${group.title} anwählen`}
                aria-label={groupSelection.checked
                  ? `Alle verfügbaren Wahloptionen für ${group.title} abwählen`
                  : `Alle verfügbaren Wahloptionen für ${group.title} anwählen`}
              />
            </Table.Cell>
            <Table.Cell colspan={3} class="p-0">
              <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <Button
                  variant="ghost"
                  class="group/disclosure h-auto min-w-64 flex-1 justify-start rounded-none px-4 py-3 text-left whitespace-normal hover:bg-transparent focus-visible:z-10"
                  onclick={() => toggleGroup(group.genericModuleId)}
                  aria-expanded={expanded}
                  aria-controls={candidatesId}
                  aria-label="Wahloptionen für {group.title} {expanded
                    ? 'einklappen'
                    : 'ausklappen'}"
                >
                  <span
                    class="border-border bg-background group-hover/disclosure:border-foreground/25 flex size-7 shrink-0 items-center justify-center rounded-md border shadow-xs transition-colors"
                  >
                    <ChevronRight
                      class={cn(
                        'text-muted-foreground size-4 transition-transform duration-200 motion-reduce:transition-none',
                        expanded && 'rotate-90'
                      )}
                      aria-hidden="true"
                    />
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-medium">{group.title}</span>
                    <span class="text-muted-foreground block text-xs">
                      {group.abbrev} · {group.optionCandidates.length}
                      {group.optionCandidates.length === 1 ? 'Wahloption' : 'Wahloptionen'}
                    </span>
                  </span>
                  <Badge variant="secondary" class="shrink-0 rounded-sm font-normal tabular-nums">
                    {includedCount(group)}/{group.optionCandidates.length} enthalten
                  </Badge>
                  <span
                    class="text-muted-foreground ml-auto hidden text-xs font-normal xl:inline"
                    aria-hidden="true"
                  >
                    {expanded ? 'Optionen einklappen' : 'Optionen ausklappen'}
                  </span>
                </Button>

                {#if groupExcluded}
                  <Badge
                    variant="outline"
                    class="text-muted-foreground mr-3 shrink-0 rounded-sm font-normal"
                    title="Der Platzhalter wurde unter Pflichtmodule abgewählt – seine Optionen werden nicht im Modulhandbuch berücksichtigt."
                  >
                    Platzhalter abgewählt
                  </Badge>
                {/if}
              </div>
            </Table.Cell>
          </Table.Row>
        </Table.Body>

        <Table.Body
          id={candidatesId}
          hidden={!expanded}
          aria-label="Wahloptionen für {group.title}"
        >
          {#each group.visibleCandidates as candidate (`${group.genericModuleId}|${candidate.moduleId}`)}
            {@const optionExcluded = config.isModuleExcluded(candidate.moduleId)}
            {@const disabled = groupExcluded || optionExcluded}
            {@const checked = isOptionIncluded(group, candidate)}
            <Table.Row
              class={cn(
                !disabled && 'cursor-pointer',
                !checked && 'bg-muted/40',
                disabled && 'opacity-60'
              )}
              onclick={disabled
                ? undefined
                : (event) => {
                    if ((event.target as Element).closest('button')) {
                      return
                    }
                    config.setElectiveOptionIncluded(
                      group.genericModuleId,
                      candidate.moduleId,
                      !checked
                    )
                  }}
            >
              <Table.Cell>
                <Checkbox
                  {checked}
                  {disabled}
                  onCheckedChange={(checked) =>
                    config.setElectiveOptionIncluded(
                      group.genericModuleId,
                      candidate.moduleId,
                      checked === true
                    )}
                  aria-label="{candidate.title} als Wahloption für {group.title}"
                />
              </Table.Cell>
              <Table.Cell>
                <div class={cn('font-medium', !checked && 'text-muted-foreground line-through')}>
                  {candidate.title}
                </div>
                <div class="text-muted-foreground text-xs">{candidate.abbrev}</div>
                {#if optionExcluded}
                  <div class="text-muted-foreground text-xs">über Pflichtmodule ausgeschlossen</div>
                {/if}
              </Table.Cell>
              <Table.Cell
                class={cn('text-right tabular-nums', !checked && 'text-muted-foreground')}
              >
                {candidate.ects.toLocaleString('de-DE')}
              </Table.Cell>
              <Table.Cell>
                <Badge
                  variant="outline"
                  class={cn('rounded-sm px-1.5 font-normal', !checked && 'text-muted-foreground')}
                  title={group.title}
                >
                  {group.abbrev}
                </Badge>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      {:else}
        <Table.Body>
          <Table.Row>
            <Table.Cell colspan={4} class="text-muted-foreground h-24 text-center">
              Keine Wahlmodule gefunden
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      {/each}
    </Table.Root>
  </div>
</div>
