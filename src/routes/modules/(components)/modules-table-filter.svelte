<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { moduleFilter } from '$lib/store.svelte'
  import type { ModuleView } from '$lib/types/module'
  import { X, Funnel, Search } from '@lucide/svelte'
  import type { Table } from '@tanstack/table-core'
  import FilterOption from '$lib/components/filter-option.svelte'

  let { table }: { table: Table<ModuleView> } = $props()

  let showReset = $derived.by(() => {
    const {
      selectedStudyPrograms,
      selectedIdentities,
      selectedSemester,
      selectedModuleTypes,
      title
    } = moduleFilter

    return (
      selectedStudyPrograms.length > 0 ||
      selectedIdentities.length > 0 ||
      selectedSemester.length > 0 ||
      selectedModuleTypes.length > 0 ||
      title.length > 0
    )
  })

  function setFilterValue(value: string) {
    moduleFilter.title = value
    table.getColumn('title')?.setFilterValue(value)
  }

  function selectModuleManagement(id: string) {
    moduleFilter.selectIdentity(id)
    table.getColumn('moduleManagement')?.setFilterValue(moduleFilter.selectedIdentities)
  }

  function selectSemester(id: string) {
    moduleFilter.selectSemester(id)
    table.getColumn('semester')?.setFilterValue(moduleFilter.selectedSemester)
  }

  function selectStudyProgram(id: string) {
    moduleFilter.selectStudyProgram(id)
    table.getColumn('studyProgram')?.setFilterValue(moduleFilter.selectedStudyPrograms)
  }

  function selectModuleType(id: string) {
    moduleFilter.selectModuleType(id)
    table.getColumn('moduleType')?.setFilterValue(moduleFilter.selectedModuleTypes)
  }

  function clearSemester() {
    moduleFilter.clearSelectedSemester()
    table.getColumn('semester')?.setFilterValue(undefined)
  }

  function clearModuleManagement() {
    moduleFilter.clearSelectedIdentities()
    table.getColumn('moduleManagement')?.setFilterValue(undefined)
  }

  function clearStudyProgram() {
    moduleFilter.clearSelectedStudyPrograms()
    table.getColumn('studyProgram')?.setFilterValue(undefined)
  }

  function clearModuleType() {
    moduleFilter.clearSelectedModuleTypes()
    table.getColumn('moduleType')?.setFilterValue(undefined)
  }

  function reset() {
    setFilterValue('')
    clearSemester()
    clearModuleManagement()
    clearStudyProgram()
    clearModuleType()
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
        value={table.getColumn('title')?.getFilterValue()?.toString() ?? ''}
        onchange={(e) => setFilterValue(e.currentTarget.value)}
        oninput={(e) => setFilterValue(e.currentTarget.value)}
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
        handleSelect={selectStudyProgram}
        title="Studiengang"
        options={moduleFilter.studyPrograms}
        clearFilters={clearStudyProgram}
      />
      <FilterOption
        filterValues={moduleFilter.selectedSemester}
        handleSelect={selectSemester}
        title="Semester"
        options={moduleFilter.semester}
        clearFilters={clearSemester}
      />
      <FilterOption
        filterValues={moduleFilter.selectedIdentities}
        handleSelect={selectModuleManagement}
        title="Modulverantwortliche"
        options={moduleFilter.identities}
        clearFilters={clearModuleManagement}
      />
      <FilterOption
        filterValues={moduleFilter.selectedModuleTypes}
        handleSelect={selectModuleType}
        title="Modulart"
        options={moduleFilter.moduleTypes}
        clearFilters={clearModuleType}
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
