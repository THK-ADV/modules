<script lang="ts">
  import SchedulePlanningEditor from '$lib/components/schedule/schedule-planning-editor.svelte'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Live-Daten bearbeiten</h2>
    <p class="text-muted-foreground text-sm">
      Termine im veröffentlichten Stundenplan direkt anpassen.
    </p>
  </div>

  <SchedulePlanningEditor
    calendarData={{
      holidays: data.holidays,
      holidaysMonth: data.holidaysMonth,
      semesterEntries: data.semesterEntries
    }}
  />
</div>
