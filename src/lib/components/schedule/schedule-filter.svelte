<script lang="ts">
  import FilterOption from '$lib/components/filter-option.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { IsMobile } from '$lib/hooks/is-mobile.svelte'
  import { cn } from '$lib/utils.js'
  import { ChevronDown, Funnel, Layers, Search, X } from '@lucide/svelte'
  import type { ScheduleProps } from './types'
  import { StudyProgramFilter } from '$lib/components/study-program-filter'

  let { scheduleFilter }: { scheduleFilter: ScheduleProps['scheduleFilter'] } = $props()

  const showReset = $derived.by(() => {
    const {
      searchString,
      selectedTeachingUnits,
      selectedCourseTypes,
      selectedModules,
      selectedStudyPrograms,
      selectedSemesters,
      selectedIdentities,
      selectedRooms,
      selectedModuleTypes
    } = scheduleFilter

    return (
      searchString.length > 0 ||
      selectedTeachingUnits.length > 0 ||
      selectedCourseTypes.length > 0 ||
      selectedModules.length > 0 ||
      selectedStudyPrograms.length > 0 ||
      selectedSemesters.length > 0 ||
      selectedIdentities.length > 0 ||
      selectedRooms.length > 0 ||
      selectedModuleTypes.length > 0
    )
  })

  // Mobile handling

  let filtersOpen = $state(false)
  let sourcesOpen = $state(false)

  const isMobile = new IsMobile()

  const activeSourceDimensions = $derived.by(() => {
    const { showSemester, showSchedule, showExams } = scheduleFilter
    let count = 0
    if (showSemester) count++
    if (showSchedule) count++
    if (showExams) count++
    return count
  })

  let activeFilterDimensions = $derived.by(() => {
    const {
      selectedTeachingUnits,
      selectedCourseTypes,
      selectedModules,
      selectedStudyPrograms,
      selectedSemesters,
      selectedIdentities,
      selectedRooms,
      selectedModuleTypes
    } = scheduleFilter

    let count = 0
    if (selectedTeachingUnits.length > 0) {
      count++
    }
    if (selectedCourseTypes.length > 0) {
      count++
    }
    if (selectedModules.length > 0) {
      count++
    }
    if (selectedStudyPrograms.length > 0) {
      count++
    }
    if (selectedSemesters.length > 0) {
      count++
    }
    if (selectedIdentities.length > 0) {
      count++
    }
    if (selectedRooms.length > 0) {
      count++
    }
    if (selectedModuleTypes.length > 0) {
      count++
    }
    return count
  })

  // Quick search

  let searchInputEl: HTMLInputElement | null = $state(null)
  const showSearchShortcut = $derived(scheduleFilter.searchString.trim().length === 0)

  function handleGlobalKeydown(e: KeyboardEvent) {
    // Press `/` to focus the search input.
    if (e.key === '/') {
      const target = e.target
      // Don't hijack typing in inputs/contenteditable elements (e.g. edit dialogs).
      if (target instanceof HTMLElement) {
        if (
          target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT'
        ) {
          return
        }
      }

      if (document.activeElement !== searchInputEl) {
        e.preventDefault()
        searchInputEl?.focus()
        return
      }
    }

    // Press `Esc` to clear search when the input is focused.
    if (e.key === 'Escape' && document.activeElement === searchInputEl) {
      e.preventDefault()
      scheduleFilter.searchString = ''
      searchInputEl?.blur()
    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#snippet filterOptions()}
  <FilterOption
    filterValues={scheduleFilter.selectedTeachingUnits}
    handleSelect={scheduleFilter.selectTeachingUnit}
    title="Lehreinheit"
    options={scheduleFilter.teachingUnits}
    clearFilters={scheduleFilter.clearSelectedTeachingUnits}
  />
  <FilterOption
    filterValues={scheduleFilter.selectedSemesters}
    handleSelect={scheduleFilter.selectSemester}
    title="Semester"
    options={scheduleFilter.semesters}
    clearFilters={scheduleFilter.clearSelectedSemesters}
  />
  <StudyProgramFilter
    displayVariant={5}
    filterValues={scheduleFilter.selectedStudyPrograms}
    handleSelect={scheduleFilter.selectStudyProgram}
    title="Studiengang"
    options={scheduleFilter.studyPrograms}
    clearFilters={scheduleFilter.clearSelectedStudyPrograms}
  />
  <FilterOption
    filterValues={scheduleFilter.selectedModules}
    handleSelect={scheduleFilter.selectModule}
    title="Modul"
    options={scheduleFilter.modules}
    clearFilters={scheduleFilter.clearSelectedModules}
  />
  <FilterOption
    filterValues={scheduleFilter.selectedModuleTypes}
    handleSelect={scheduleFilter.selectModuleType}
    title="Modulart"
    options={scheduleFilter.moduleTypes}
    clearFilters={scheduleFilter.clearSelectedModuleTypes}
  />
  <FilterOption
    filterValues={scheduleFilter.selectedCourseTypes}
    handleSelect={scheduleFilter.selectCourseType}
    title="Kursart"
    options={scheduleFilter.courseTypes}
    clearFilters={scheduleFilter.clearSelectedCourseTypes}
  />
  <FilterOption
    filterValues={scheduleFilter.selectedIdentities}
    handleSelect={scheduleFilter.selectIdentity}
    title="Modulverantwortliche"
    options={scheduleFilter.identities}
    clearFilters={scheduleFilter.clearSelectedIdentities}
  />
  <FilterOption
    filterValues={scheduleFilter.selectedRooms}
    handleSelect={scheduleFilter.selectRoom}
    title="Raum"
    options={scheduleFilter.rooms}
    clearFilters={scheduleFilter.clearSelectedRooms}
  />
{/snippet}

{#snippet sourceOptions()}
  <div class="flex items-center gap-2">
    <Checkbox id="source-semester" bind:checked={scheduleFilter.showSemester} />
    <Label for="source-semester" class="cursor-pointer text-sm font-normal">Semesterplan</Label>
  </div>

  <div class="flex items-center gap-2">
    <Checkbox id="source-schedule" bind:checked={scheduleFilter.showSchedule} />
    <Label for="source-schedule" class="cursor-pointer text-sm font-normal">Stundenplan</Label>
  </div>

  <div class="flex items-center gap-2">
    <Checkbox id="source-exams" bind:checked={scheduleFilter.showExams} disabled={true} />
    <Label for="source-exams" class="cursor-pointer text-sm font-normal">Prüfungen</Label>
  </div>
{/snippet}

<div class="min-w-0 space-y-4">
  <!-- Search Section -->
  <div class="flex min-w-0 items-center gap-3">
    <div
      class="text-muted-foreground hidden shrink-0 items-center gap-2 text-sm font-medium md:flex md:w-20"
    >
      <Search class="size-4" />
      <span>Suche</span>
    </div>
    <div class="w-full min-w-0 flex-1 md:w-auto">
      <div class="relative w-full md:w-md">
        <Input
          placeholder="Suche nach Modulbezeichnung oder Kürzel…"
          class={cn(
            'border-muted-foreground/20 focus-visible:border-primary focus-visible:ring-primary/20 h-10 w-full border-2 text-sm transition-colors focus-visible:ring-2',
            showSearchShortcut ? 'pr-10' : 'pr-3'
          )}
          type="search"
          bind:value={scheduleFilter.searchString}
          bind:ref={searchInputEl}
        />
        {#if showSearchShortcut}
          <kbd
            class="bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-medium"
            >/</kbd
          >
        {/if}
      </div>
    </div>
  </div>

  {#if isMobile.current}
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-2">
        <!-- Source Button -->
        <Button
          onclick={() => {
            sourcesOpen = !sourcesOpen
            if (sourcesOpen) filtersOpen = false
          }}
          aria-expanded={sourcesOpen}
          aria-controls="schedule-filter-sources-panel"
          aria-label={sourcesOpen ? 'Quellen einklappen' : 'Quellen ausklappen'}
          variant="outline"
          class="border-muted-foreground/25 hover:bg-muted/50 h-11 w-full justify-between gap-2 border-2 border-dashed px-3 font-medium"
          type="button"
        >
          <span class="flex min-w-0 items-center gap-2">
            <Layers class="text-muted-foreground size-4 shrink-0" />
            <span class="truncate">Quellen</span>
            {#if activeSourceDimensions > 0}
              <Badge variant="secondary" class="shrink-0 rounded-sm px-1 tabular-nums">
                {activeSourceDimensions}
              </Badge>
            {/if}
          </span>
          <ChevronDown
            class={cn(
              'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
              sourcesOpen && 'rotate-180'
            )}
          />
        </Button>

        <!-- Filter Button -->
        <Button
          onclick={() => {
            filtersOpen = !filtersOpen
            if (filtersOpen) sourcesOpen = false
          }}
          aria-expanded={filtersOpen}
          aria-controls="schedule-filter-filters-panel"
          aria-label={filtersOpen ? 'Filter einklappen' : 'Filter ausklappen'}
          variant="outline"
          class="border-muted-foreground/25 hover:bg-muted/50 h-11 w-full justify-between gap-2 border-2 border-dashed px-3 font-medium"
          type="button"
        >
          <span class="flex min-w-0 items-center gap-2">
            <Funnel class="text-muted-foreground size-4 shrink-0" />
            <span class="truncate">Filter</span>
            {#if activeFilterDimensions > 0}
              <Badge variant="secondary" class="shrink-0 rounded-sm px-1 tabular-nums">
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
      </div>

      <!-- Content below the grid, full width -->
      {#if sourcesOpen}
        <div id="schedule-filter-sources-panel" class="flex flex-col gap-2">
          {@render sourceOptions()}
        </div>
      {/if}

      {#if filtersOpen}
        <div id="schedule-filter-filters-panel" class="flex flex-wrap gap-2">
          {@render filterOptions()}
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex min-w-0 items-center gap-3">
      <div
        class="text-muted-foreground flex shrink-0 items-center gap-2 text-sm font-medium md:w-20"
      >
        <Funnel class="size-4" />
        <span>Filter</span>
      </div>

      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {@render filterOptions()}
      </div>
    </div>

    <!-- Source Selection -->
    <div class="flex min-w-0 items-center gap-3">
      <div class="text-muted-foreground flex w-20 items-center gap-2 text-sm font-medium">
        <Layers class="size-4" />
        <span>Quellen</span>
      </div>
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-4">
        {@render sourceOptions()}
      </div>
    </div>
  {/if}

  <!-- Reset Section -->
  {#if showReset}
    <div class="flex items-center gap-3">
      <Button
        onclick={() => scheduleFilter.clearSelections()}
        variant="outline"
        size="sm"
        class="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
      >
        <X class="size-4" />
        Filter zurücksetzen
      </Button>
    </div>
  {/if}
</div>
