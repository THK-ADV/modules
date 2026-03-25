<script lang="ts">
  import FilterOption from '$lib/components/filter-option.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Collapsible from '$lib/components/ui/collapsible/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { IsMobile } from '$lib/hooks/is-mobile.svelte.js'
  import { moduleFilter } from '$lib/stores/module-filter.svelte'
  import { cn } from '$lib/utils.js'
  import { ChevronDown, Funnel, Search, X } from '@lucide/svelte'

  let showReset = $derived.by(() => {
    const {
      selectedStudyPrograms,
      selectedIdentities,
      selectedSemester,
      selectedModuleTypes,
      selectedModuleStatus,
      title
    } = moduleFilter

    return (
      selectedStudyPrograms.length > 0 ||
      selectedIdentities.length > 0 ||
      selectedSemester.length > 0 ||
      selectedModuleTypes.length > 0 ||
      selectedModuleStatus.length > 0 ||
      title.length > 0
    )
  })

  let filtersOpen = $state(false)

  const isMobile = new IsMobile()

  let activeFilterDimensions = $derived.by(() => {
    const {
      selectedStudyPrograms,
      selectedIdentities,
      selectedSemester,
      selectedModuleTypes,
      selectedModuleStatus
    } = moduleFilter

    let count = 0
    if (selectedStudyPrograms.length > 0) {
      count++
    }
    if (selectedSemester.length > 0) {
      count++
    }
    if (selectedIdentities.length > 0) {
      count++
    }
    if (selectedModuleTypes.length > 0) {
      count++
    }
    if (selectedModuleStatus.length > 0) {
      count++
    }
    return count
  })

  const filterTitle = $derived.by(() => {
    if (activeFilterDimensions > 0) {
      return 'Filter aktiv'
    }
    if (!filtersOpen) {
      return 'Filter anzeigen'
    }

    return 'Filter ausblenden'
  })

  function reset() {
    moduleFilter.clearSelections()
  }

  // Quick search

  let searchInputEl: HTMLInputElement | null = $state(null)

  function handleGlobalKeydown(e: KeyboardEvent) {
    // Press `/` to focus the search input.
    if (e.key === '/' && document.activeElement !== searchInputEl) {
      e.preventDefault()
      searchInputEl?.focus()
      return
    }
    // Press `Esc` to clear search when the input is focused.
    if (e.key === 'Escape' && document.activeElement === searchInputEl) {
      e.preventDefault()
      moduleFilter.title = ''
      searchInputEl?.blur()
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#snippet filterOptions()}
  <FilterOption
    filterValues={moduleFilter.selectedStudyPrograms}
    handleSelect={moduleFilter.selectStudyProgram}
    title="Studiengang"
    options={moduleFilter.studyPrograms}
    clearFilters={moduleFilter.clearSelectedStudyPrograms}
  />
  <FilterOption
    filterValues={moduleFilter.selectedSemester}
    handleSelect={moduleFilter.selectSemester}
    title="Semester"
    options={moduleFilter.semester}
    clearFilters={moduleFilter.clearSelectedSemester}
  />
  <FilterOption
    filterValues={moduleFilter.selectedIdentities}
    handleSelect={moduleFilter.selectIdentity}
    title="Modulverantwortliche"
    options={moduleFilter.identities}
    clearFilters={moduleFilter.clearSelectedIdentities}
  />
  <FilterOption
    filterValues={moduleFilter.selectedModuleTypes}
    handleSelect={moduleFilter.selectModuleType}
    title="Modulart"
    options={moduleFilter.moduleTypes}
    clearFilters={moduleFilter.clearSelectedModuleTypes}
  />
  <FilterOption
    filterValues={moduleFilter.selectedModuleStatus}
    handleSelect={moduleFilter.selectModuleStatus}
    title="Status"
    options={moduleFilter.moduleStatus}
    clearFilters={moduleFilter.clearSelectedModuleStatus}
  />
{/snippet}

<div class="min-w-0 space-y-4">
  <!-- Search Section -->
  <div class="flex min-w-0 items-center gap-3">
    <div
      class="text-muted-foreground hidden shrink-0 items-center gap-2 text-sm font-medium md:flex md:w-16"
    >
      <Search class="size-4" />
      <span>Suche</span>
    </div>
    <div class="w-full min-w-0 flex-1 md:w-auto">
      <Input
        placeholder="Suche nach Modulbezeichnung oder Kürzel…"
        class="border-muted-foreground/20 focus-visible:border-primary focus-visible:ring-primary/20 h-10 w-full border-2 text-sm transition-colors focus-visible:ring-2 md:max-w-md"
        type="search"
        bind:value={moduleFilter.title}
        bind:ref={searchInputEl}
      />
    </div>
  </div>

  <!-- Filter Section -->
  {#if isMobile.current}
    <Collapsible.Root bind:open={filtersOpen} class="min-w-0">
      <Collapsible.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="outline"
            class="border-muted-foreground/25 hover:bg-muted/50 h-11 w-full justify-between gap-2 border-2 border-dashed px-3 font-medium"
            type="button"
          >
            <span class="flex min-w-0 items-center gap-2">
              <Funnel class="text-muted-foreground size-4 shrink-0" />
              <span class="truncate">{filterTitle}</span>
              {#if activeFilterDimensions > 0}
                <Badge variant="secondary" class="shrink-0 rounded-sm px-1.5 tabular-nums">
                  {activeFilterDimensions}
                </Badge>
              {/if}
            </span>
            <ChevronDown
              class={cn(
                'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
                filtersOpen && 'rotate-180'
              )}
            />
          </Button>
        {/snippet}
      </Collapsible.Trigger>
      <Collapsible.Content class="overflow-hidden">
        <div class="border-border/60 flex flex-wrap gap-2 border-t pt-3">
          {@render filterOptions()}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  {:else}
    <div class="flex min-w-0 items-center gap-3">
      <div
        class="text-muted-foreground flex shrink-0 items-center gap-2 text-sm font-medium md:w-16"
      >
        <Funnel class="size-4" />
        <span>Filter</span>
      </div>

      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {@render filterOptions()}
      </div>
    </div>
  {/if}

  <!-- Reset Section -->
  {#if showReset}
    <div class="flex items-center gap-3">
      <Button
        onclick={reset}
        variant="outline"
        size="sm"
        class="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
      >
        <X class="size-4" />
        Alle Filter zurücksetzen
      </Button>
    </div>
  {/if}
</div>
