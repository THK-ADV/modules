<script lang="ts">
  import { createDraftScheduleEntryEditorApi } from '$lib/components/schedule/schedule-entry-editor-api'
  import SchedulePlanningEditor from '$lib/components/schedule/schedule-planning-editor.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const scheduleEntryApi = $derived(createDraftScheduleEntryEditorApi(data.planDraft.id))
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <h2 class="text-3xl font-bold tracking-tight">
    <span class="sm:hidden">
      Stundenplanung für {data.semester.abbrev.toUpperCase()}
      {String(data.semester.year).slice(-2)}
    </span>
    <span class="hidden sm:inline">
      Stundenplanung für {data.semester.deLabel}
      {data.semester.year}
    </span>
  </h2>

  <SchedulePlanningEditor
    api={scheduleEntryApi}
    calendarData={{
      holidays: data.holidays,
      holidaysMonth: data.holidaysMonth,
      semesterEntries: data.semesterEntries
    }}
  />
</div>
