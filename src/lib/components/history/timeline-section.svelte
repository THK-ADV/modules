<script lang="ts">
  import { HistoryTimeline } from '$lib/components/history'
  import type { ModuleVersion } from '$lib/types/module-version'
  import * as Card from '$lib/components/ui/card'

  type Side = 'left' | 'right'

  type Props = {
    history: ModuleVersion[]
    selectedLeftCommitId: string | null
    selectedRightCommitId: string | null
    /** Highlight which version is shown in Datei tab */
    filePreviewCommitId: string | null
    focusedEventCommitId: string | null
    /** 'file' = click selects file; 'diff' = click opens assignment popover */
    interactionMode: 'file' | 'diff'
    onNodeClick: (version: ModuleVersion) => void
    onAssignSide: (version: ModuleVersion, side: Side) => void
    onShowFile: (version: ModuleVersion) => void
    onNodeDragStart: (version: ModuleVersion, event: DragEvent) => void
    onNodeDragEnd: () => void
  }

  let {
    history,
    selectedLeftCommitId,
    selectedRightCommitId,
    filePreviewCommitId,
    focusedEventCommitId,
    interactionMode,
    onNodeClick,
    onAssignSide,
    onShowFile,
    onNodeDragStart,
    onNodeDragEnd
  }: Props = $props()
</script>

<Card.Root class="max-w-full min-w-0 overflow-hidden">
  <Card.Header class="space-y-2 pb-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="text-foreground text-md inline-flex items-center gap-1.5 font-medium">
        <span class="inline sm:hidden">Historie</span>
        <span class="hidden sm:inline">Historie des Moduls</span>
      </div>
      <ul class="text-muted-foreground inline-flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs">
        <li class="inline-flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-emerald-500"></span>Version
        </li>
        <li class="inline-flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-zinc-500"></span>Gelöscht
        </li>
        <li class="inline-flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-amber-500"></span>
          <span class="hidden sm:inline">Parsing-Fehler</span>
          <span class="inline sm:hidden">Fehler</span>
        </li>
      </ul>
    </div>
    <p class="text-muted-foreground m-0 text-xs">
      {#if interactionMode === 'file'}
        Punkt im Zeitstrahl antippen, um diese Version anzuzeigen.
      {:else}
        Punkt antippen, um die Version als <span class="text-rose-500">Vorher</span> oder
        <span class="text-emerald-500">Nachher</span>
        zu setzen. Auf dem Desktop alternativ per Drag-and-Drop.
      {/if}
    </p>
  </Card.Header>
  <Card.Content class="max-w-full min-w-0 pt-0">
    <HistoryTimeline
      {history}
      {selectedLeftCommitId}
      {selectedRightCommitId}
      {filePreviewCommitId}
      {focusedEventCommitId}
      {interactionMode}
      {onNodeClick}
      {onAssignSide}
      {onShowFile}
      {onNodeDragStart}
      {onNodeDragEnd}
    />
  </Card.Content>
</Card.Root>
