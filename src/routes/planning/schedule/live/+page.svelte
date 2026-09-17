<script lang="ts">
  import SchedulePlanningEditor from '$lib/components/schedule/schedule-planning-editor.svelte'
  import { liveScheduleEntryEditorApi } from '$lib/components/schedule/schedule-entry-editor-api'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Live-Daten bearbeiten</h2>
    <p class="text-muted-foreground text-sm">
      Veröffentlichte Stundenplaneinträge und Einzelbuchungen direkt im Kalender bearbeiten.
    </p>
  </div>

  <SchedulePlanningEditor api={liveScheduleEntryEditorApi} canEdit={true} calendarData={data} />
</div>
