<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { moduleFilter } from '$lib/stores/module-filter.svelte'
  import { X, Funnel, Search } from '@lucide/svelte'
  import FilterOption from '$lib/components/filter-option.svelte'

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

  function reset() {
    moduleFilter.clearSelections()
  }
</script>

<div class="space-y-4">
  <!-- Search Section -->
  <div class="flex items-center gap-3">
    <div class="text-muted-foreground flex items-center gap-2 text-sm font-medium md:w-16">
      <Search class="size-4" />
      <span class="hidden md:inline">Suche</span>
    </div>
    <div class="flex-1">
      <Input
        placeholder="Suche nach Modulbezeichnung oder Kürzel…"
        class="border-muted-foreground/20 focus-visible:border-primary focus-visible:ring-primary/20 h-10 w-full max-w-md border-2 text-sm transition-colors focus-visible:ring-2"
        type="search"
        bind:value={moduleFilter.title}
      />
    </div>
  </div>

  <!-- Filter Section -->
  <div class="flex items-center gap-3">
    <div class="text-muted-foreground flex items-center gap-2 text-sm font-medium md:w-16">
      <Funnel class="size-4" />
      <span class="hidden md:inline">Filter</span>
    </div>

    <div class="flex flex-1 flex-nowrap items-center gap-2">
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
    </div>
  </div>

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
