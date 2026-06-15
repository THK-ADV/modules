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
  import { hasLiveScheduleEntrySeries } from './schedule.remote'

  interface Props {
    open?: boolean
    onUpdate: (entry: ScheduleEntryEdit, scope: ScheduleEntryUpdateScope) => void | Promise<void>
    onCancel?: () => void
  }

  let { open = $bindable(false), onUpdate, onCancel }: Props = $props()

  let pendingUpdateEntry = $state<ScheduleEntryEdit | null>(null)
  let pendingUpdateSeries = $state<SeriesOccurrence[] | null>(null)

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
    clearPendingUpdate()

    if (updateEntry.seriesId.length === 0) {
      updateEntryWithScope(updateEntry, 'single')
      return
    }

    const series = await hasLiveScheduleEntrySeries(updateEntry.seriesId).run()

    if (!series || series.length === 0) {
      updateEntryWithScope(updateEntry, 'single')
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

  function updateEntryWithScope(updateEntry: ScheduleEntryEdit, scope: ScheduleEntryUpdateScope) {
    clearPendingUpdate()
    onUpdate(updateEntry, scope)
  }

  function handleUpdateScope(scope: ScheduleEntryUpdateScope) {
    if (pendingUpdateEntry === null) {
      return
    }

    updateEntryWithScope(pendingUpdateEntry, scope)
  }

  function cancelUpdate() {
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
        onclick={cancelUpdate}
      >
        Abbrechen
      </Button>
      <Button
        type="button"
        variant="outline"
        class="whitespace-nowrap"
        onclick={() => handleUpdateScope('single')}
      >
        Nur diesen Termin
      </Button>
      <Button type="button" class="whitespace-nowrap" onclick={() => handleUpdateScope('series')}>
        Gesamte Terminreihe
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
