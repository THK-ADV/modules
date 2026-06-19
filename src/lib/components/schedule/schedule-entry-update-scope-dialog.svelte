<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import type {
    ScheduleEntryEdit,
    ScheduleEntryUpdateScope,
    SeriesOccurrence
  } from '$lib/types/schedule'
  import { DateFormatter } from '@internationalized/date'
  import { CalendarDays, Clock } from '@lucide/svelte'

  interface Props {
    open?: boolean
    onUpdate: (entry: ScheduleEntryEdit, scope: ScheduleEntryUpdateScope) => Promise<void>
    onCancel?: () => void
    getSeries: (seriesId: string) => Promise<SeriesOccurrence[]>
  }

  let { open = $bindable(false), onUpdate, onCancel, getSeries }: Props = $props()

  let pendingUpdateEntry = $state<ScheduleEntryEdit | null>(null)
  let pendingUpdateSeries = $state<SeriesOccurrence[] | null>(null)
  let updatingScope = $state<ScheduleEntryUpdateScope | null>(null)

  const seriesDateFormatter = new DateFormatter('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const seriesTimeFormatter = new DateFormatter('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })

  function formatSeriesDate(date: Date): string {
    return seriesDateFormatter.format(date)
  }

  function formatSeriesTimeRange(start: Date, end: Date): string {
    return `${seriesTimeFormatter.format(start)} - ${seriesTimeFormatter.format(end)}`
  }

  // Triggers the scope decision flow; opens the dialog when the entry belongs to a series.
  export async function requestUpdateScope(updateEntry: ScheduleEntryEdit) {
    if (updatingScope !== null) return

    clearPendingUpdate()

    if (updateEntry.seriesId.length === 0) {
      await updateEntryWithScope(updateEntry, 'single')
      return
    }

    const series = await getSeries(updateEntry.seriesId)

    if (series.length === 0) {
      await updateEntryWithScope(updateEntry, 'single')
    } else {
      series.sort((a, b) => a.start.getTime() - b.start.getTime())
      pendingUpdateEntry = updateEntry
      pendingUpdateSeries = series
      open = true
    }
  }

  function clearPendingUpdate() {
    pendingUpdateEntry = null
    pendingUpdateSeries = null
    open = false
  }

  async function updateEntryWithScope(
    updateEntry: ScheduleEntryEdit,
    scope: ScheduleEntryUpdateScope
  ) {
    if (updatingScope !== null) return

    updatingScope = scope
    try {
      await onUpdate(updateEntry, scope)
      clearPendingUpdate()
    } finally {
      updatingScope = null
    }
  }

  function handleUpdateScope(scope: ScheduleEntryUpdateScope) {
    if (pendingUpdateEntry === null) {
      return
    }

    void updateEntryWithScope(pendingUpdateEntry, scope)
  }

  function cancelUpdate() {
    if (updatingScope !== null) return

    const hadPendingUpdate = pendingUpdateEntry !== null
    clearPendingUpdate()

    if (hadPendingUpdate) {
      onCancel?.()
    }
  }
</script>

<Dialog.Root
  {open}
  onOpenChange={(nextOpen) => {
    if (!nextOpen) {
      cancelUpdate()
    } else {
      open = true
    }
  }}
>
  <Dialog.Content class="max-w-xl">
    <Dialog.Header>
      <Dialog.Title>Termin aktualisieren</Dialog.Title>
      <Dialog.Description>
        Soll die Änderung nur für diesen Termin oder für die gesamte Terminreihe übernommen werden?
      </Dialog.Description>
    </Dialog.Header>

    {#if pendingUpdateSeries}
      <div class="space-y-2 py-2">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="font-medium">Betroffene Serientermine</span>
          <Badge variant="secondary">{pendingUpdateSeries.length}</Badge>
        </div>
        <div class="max-h-56 overflow-y-auto rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Termin</Table.Head>
                <Table.Head>Zeit</Table.Head>
                <Table.Head class="w-32 text-right">Status</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each pendingUpdateSeries as occurrence (occurrence.id)}
                {@const isCurrentOccurrence = pendingUpdateEntry?.id === occurrence.id}
                <Table.Row data-state={isCurrentOccurrence ? 'selected' : undefined}>
                  <Table.Cell class="py-2">
                    <div class="flex min-w-0 items-center gap-2">
                      <CalendarDays class="text-muted-foreground size-4 shrink-0" />
                      <span class="truncate font-medium">{formatSeriesDate(occurrence.start)}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell class="py-2">
                    <div class="text-muted-foreground flex items-center gap-2">
                      <Clock class="size-4 shrink-0" />
                      <span class="whitespace-nowrap">
                        {formatSeriesTimeRange(occurrence.start, occurrence.end)}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell class="py-2 text-right">
                    {#if isCurrentOccurrence}
                      <Badge>Aktuell</Badge>
                    {/if}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      </div>
    {/if}

    <Dialog.Footer
      class="grid grid-cols-1 gap-2 space-x-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:space-x-0"
    >
      <Button
        type="button"
        variant="destructive"
        class="sm:justify-self-start"
        disabled={updatingScope !== null}
        onclick={cancelUpdate}
      >
        Abbrechen
      </Button>
      <Button
        type="button"
        variant="outline"
        class="whitespace-nowrap"
        disabled={updatingScope !== null}
        aria-busy={updatingScope === 'single'}
        onclick={() => handleUpdateScope('single')}
      >
        {updatingScope === 'single' ? 'Wird aktualisiert…' : 'Nur diesen Termin'}
      </Button>
      <Button
        type="button"
        class="whitespace-nowrap"
        disabled={updatingScope !== null}
        aria-busy={updatingScope === 'series'}
        onclick={() => handleUpdateScope('series')}
      >
        {updatingScope === 'series' ? 'Wird aktualisiert…' : 'Gesamte Terminreihe'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
