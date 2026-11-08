<script lang="ts">
  import { examModuleAbbrevs } from '$lib/types/exam-planning'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { fmtTime } from '$lib/formats'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { cn } from '$lib/utils'
  import { CircleCheck } from '@lucide/svelte'
  import { isCount, missingPartition } from '../exam-planning'
  import InvigilatorPicker from '../invigilator-picker.svelte'
  import InvigilatorRoster from './invigilator-roster.svelte'
  import type { Invigilation } from './invigilation.svelte'
  import RowSave from './row-save.svelte'

  let { inv, canEdit }: { inv: Invigilation; canEdit: boolean } = $props()

  /** Keeps the content next to the selection checkbox on small screens. */
  const col = $derived(canEdit && 'max-lg:col-start-2')
</script>

<div class="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
  <Card.Root class="gap-0 overflow-hidden py-0 shadow-none">
    {#each inv.days as { day, rows } (day)}
      <h2 class="bg-muted/40 border-b px-4 py-2 text-sm font-semibold lg:px-5">{day}</h2>
      <ul class="divide-y border-b last:border-b-0" aria-label="Termine am {day}">
        {#each rows as row (row.id)}
          <li
            class={cn(
              'grid gap-x-6 gap-y-3 px-4 py-4 lg:px-5',
              canEdit
                ? 'grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_5.5rem_minmax(0,14rem)_minmax(0,1fr)]'
                : 'lg:grid-cols-[5.5rem_minmax(0,14rem)_minmax(0,1fr)]',
              row.dirty && 'bg-amber-50/50 dark:bg-amber-400/5'
            )}
          >
            {#if canEdit}
              <Checkbox
                class="mt-0.5 max-lg:row-span-3"
                checked={inv.selection.has(row.id)}
                disabled={!row.rooms.length}
                onCheckedChange={(c) => inv.select(row, c)}
                aria-label="{row.entry.examName} am {day} auswählen"
              />
            {/if}
            <p class={cn('text-sm font-medium tabular-nums', col)}>
              {fmtTime(row.start)}<span class="text-muted-foreground font-normal">
                – {fmtTime(row.end)}</span
              >
            </p>
            <div class={cn('min-w-0 space-y-2', col)}>
              <div>
                <p class="text-sm font-medium wrap-anywhere">{row.entry.examName}</p>
                <p class="text-muted-foreground text-xs">{examModuleAbbrevs(row.entry)}</p>
              </div>
              {#if canEdit}<RowSave {inv} {row} />{/if}
            </div>
            {#if row.rooms.length}
              <ul class={cn('space-y-4', col)}>
                {#each row.rooms as r (r.room)}
                  {@const clashes = inv.clashes(row, r)}
                  {@const [stateClass, stateLabel] = inv.roomState(r)}
                  <li
                    class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_7rem]"
                  >
                    <div class="min-w-0 space-y-1">
                      <p class="truncate text-sm" title={r.saved.label}>
                        <span class="font-medium">{r.saved.abbrev}</span>
                        <span class="text-muted-foreground">{r.saved.label}</span>
                      </p>
                      {#if r.saved.partitionBy && r.saved.partitionValue}
                        <p class="text-muted-foreground truncate text-xs">
                          {r.saved.partitionBy}
                          <span class="text-foreground font-medium">{r.saved.partitionValue}</span>
                        </p>
                      {:else if missingPartition(r.saved, row.rooms.length)}
                        <p class="text-xs text-amber-700 dark:text-amber-400">Aufteilung fehlt</p>
                      {/if}
                    </div>
                    <div class="min-w-0 max-md:order-last max-md:col-span-full">
                      {#if canEdit}
                        <InvigilatorPicker
                          label="Aufsichtspersonen in {r.saved.abbrev}"
                          disabled={inv.assigning}
                          options={inv.personOptions(row, r.room, r.invigilators)}
                          value={r.invigilators}
                          onValueChange={(invigilators) => inv.edit(row, r.room, { invigilators })}
                        />
                      {:else}
                        <p class="text-sm">
                          {r.invigilators.length
                            ? r.invigilators.map(inv.shortName).join('; ')
                            : 'Niemand eingeteilt'}
                        </p>
                      {/if}
                      {#if clashes.length}
                        <p class="mt-1 text-xs text-red-700 dark:text-red-400">
                          Zeitgleich eingeteilt: {clashes.map(inv.shortName).join(', ')}
                        </p>
                      {/if}
                    </div>
                    <div
                      class={cn(
                        'flex flex-col items-end gap-2 justify-self-end',
                        !canEdit && 'md:pt-2'
                      )}
                    >
                      {#if canEdit}
                        {@const id = `required-${row.id}-${r.room}`}
                        <div class="flex items-center gap-2">
                          <Label for={id} class="text-muted-foreground text-xs font-normal"
                            >Bedarf</Label
                          >
                          <Input
                            {id}
                            type="number"
                            min="0"
                            step="1"
                            inputmode="numeric"
                            placeholder="?"
                            aria-label="Bedarf an Aufsichten in {r.saved.abbrev}"
                            title="Leer lassen, solange der Bedarf unbekannt ist"
                            class="h-9 w-14 px-2 text-right tabular-nums"
                            disabled={inv.assigning}
                            aria-invalid={!isCount(r.requiredInvigilators)}
                            bind:value={
                              () => r.requiredInvigilators,
                              (requiredInvigilators) =>
                                inv.edit(row, r.room, { requiredInvigilators })
                            }
                          />
                        </div>
                      {/if}
                      <Badge variant="outline" class={cn('font-normal', stateClass)}
                        >{stateLabel}</Badge
                      >
                    </div>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class={cn('text-sm text-amber-700 dark:text-amber-400', col)}>
                Kein Raum zugeordnet; Räume im Kalender zuordnen.
              </p>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <Empty.Root class="py-10">
        <Empty.Header>
          <CircleCheck class="text-muted-foreground mx-auto size-5" aria-hidden="true" />
          <Empty.Title class="text-sm"
            >{inv.rows.length ? 'Keine Treffer' : 'Keine Termine'}</Empty.Title
          >
          <Empty.Description>
            {inv.rows.length
              ? 'Kein Termin passt zu Suche und Filter.'
              : 'Termine im Kalender anlegen und Räume zuordnen.'}
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {/each}
  </Card.Root>

  <InvigilatorRoster {inv} class="xl:sticky xl:top-6" />
</div>
