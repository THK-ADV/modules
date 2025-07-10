<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { moduleFilter } from '$lib/store.svelte'
  import type { ModuleView } from '$lib/types/module'
  import Filter from '@lucide/svelte/icons/filter'
  import Search from '@lucide/svelte/icons/search'
  import X from '@lucide/svelte/icons/x'
  import type { Table } from '@tanstack/table-core'
  import DataTableFilterOption from './modules-table-filter-option.svelte'

  let { table }: { table: Table<ModuleView> } = $props()

  let showReset = $derived.by(() => {
    const tableFilter = table.getColumn('title')?.getFilterValue() as string
    return (
      moduleFilter.selectedStudyPrograms.length > 0 ||
      moduleFilter.selectedIdentities.length > 0 ||
      moduleFilter.selectedSemester.length > 0 ||
      tableFilter
    )
  })

  function setFilterValue(value: string) {
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

  function reset() {
    setFilterValue('')
    clearSemester()
    clearModuleManagement()
    clearStudyProgram()
  }
</script>

<div class="space-y-4">
  <!-- Search Section -->
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground md:w-16">
      <Search class="h-4 w-4" />
      <span class="hidden md:inline">Suche</span>
    </div>
    <div class="flex-1">
      <Input
        placeholder="Suche nach Modulbezeichnung..."
        class="h-9 w-full max-w-md text-sm"
        type="search"
        value={table.getColumn('title')?.getFilterValue()?.toString() ?? ''}
        onchange={(e) => setFilterValue(e.currentTarget.value)}
        oninput={(e) => setFilterValue(e.currentTarget.value)}
      />
    </div>
  </div>

  <!-- Filter Section -->
  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground md:w-16">
      <Filter class="h-4 w-4" />
      <span class="hidden md:inline">Filter</span>
    </div>

    <div class="flex flex-1 flex-nowrap items-center gap-2">
      <DataTableFilterOption
        filterValues={moduleFilter.selectedStudyPrograms}
        handleSelect={selectStudyProgram}
        title="Studiengang"
        options={moduleFilter.studyPrograms}
        clearFilters={clearStudyProgram}
      />
      <DataTableFilterOption
        filterValues={moduleFilter.selectedSemester}
        handleSelect={selectSemester}
        title="Semester"
        options={moduleFilter.semester}
        clearFilters={clearSemester}
      />
      <DataTableFilterOption
        filterValues={moduleFilter.selectedIdentities}
        handleSelect={selectModuleManagement}
        title="Modulverantwortliche"
        options={moduleFilter.identities}
        clearFilters={clearModuleManagement}
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
        class="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <X class="h-4 w-4" />
        Alle Filter zurücksetzen
      </Button>
    </div>
  {/if}
</div>
