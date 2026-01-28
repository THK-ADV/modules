<script lang="ts">
  import type { EventSource } from '$lib/calendar'
  import FilterOption from '$lib/components/filter-option.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { scheduleFilter } from '$lib/store.svelte'
  import { Funnel, Layers, Search, X } from '@lucide/svelte'

  let { sourceEventCounts }: { sourceEventCounts: Record<EventSource, number> } = $props()

  const showReset = $derived.by(() => {
    const {
      searchString,
      selectedTeachingUnits,
      selectedCourseTypes,
      selectedModules,
      selectedStudyPrograms,
      selectedSemesters,
      selectedIdentities,
      selectedRooms
    } = scheduleFilter
    return (
      searchString.length > 0 ||
      selectedTeachingUnits.length > 0 ||
      selectedCourseTypes.length > 0 ||
      selectedModules.length > 0 ||
      selectedStudyPrograms.length > 0 ||
      selectedSemesters.length > 0 ||
      selectedIdentities.length > 0 ||
      selectedRooms.length > 0
    )
  })
</script>

<div class="space-y-4">
  <!-- Search Section -->
  <div class="flex items-center gap-3">
    <div class="text-muted-foreground flex w-20 items-center gap-2 text-sm font-medium">
      <Search class="size-4" />
      <span>Suche</span>
    </div>
    <div class="flex-1">
      <Input
        placeholder="Suche nach Modulbezeichnung…"
        class="border-muted-foreground/20 focus-visible:border-primary focus-visible:ring-primary/20 h-9 w-full max-w-md border bg-transparent text-sm transition-colors focus-visible:ring-2"
        type="search"
        bind:value={scheduleFilter.searchString}
      />
    </div>
  </div>

  <!-- Source Selection -->
  <div class="flex items-center gap-3">
    <div class="text-muted-foreground flex w-20 items-center gap-2 text-sm font-medium">
      <Layers class="size-4" />
      <span>Quellen</span>
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <Checkbox id="source-holidays" bind:checked={scheduleFilter.showHolidays} />
        <Label for="source-holidays" class="cursor-pointer text-sm font-normal">Feiertage</Label>
        <span class="text-muted-foreground text-sm">({sourceEventCounts.holiday})</span>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="source-semester" bind:checked={scheduleFilter.showSemester} />
        <Label for="source-semester" class="cursor-pointer text-sm font-normal">Semesterplan</Label>
        <span class="text-muted-foreground text-sm">({sourceEventCounts['semester-plan']})</span>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="source-schedule" bind:checked={scheduleFilter.showSchedule} />
        <Label for="source-schedule" class="cursor-pointer text-sm font-normal">Stundenplan</Label>
        <span class="text-muted-foreground text-sm">({sourceEventCounts.schedule})</span>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="source-exams" bind:checked={scheduleFilter.showExams} disabled={true} />
        <Label for="source-exams" class="cursor-pointer text-sm font-normal">Prüfungen</Label>
        <span class="text-muted-foreground text-sm">({sourceEventCounts.exam})</span>
      </div>
    </div>
  </div>

  <!-- Filter Section -->
  <div class="flex items-center gap-3">
    <div class="text-muted-foreground flex w-20 items-center gap-2 text-sm font-medium">
      <Funnel class="size-4" />
      <span>Filter</span>
    </div>
    <div class="flex flex-1 flex-wrap items-center gap-2">
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
      <FilterOption
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
    </div>
  </div>

  <!-- Reset Section -->
  {#if showReset}
    <div class="flex items-center gap-3">
      <div class="w-20"></div>
      <Button
        onclick={scheduleFilter.clearSelections}
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
