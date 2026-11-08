<script lang="ts">
  import { EXAM_COLOR } from '$lib/calendar/types'
  import { fmtExamPO } from '$lib/components/schedule/exam-entry-facts.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import type { ExamOffer } from '$lib/schemas/exam-planning'
  import { fmtDate } from '$lib/formats'
  import type { StudyProgram } from '$lib/types/study-program'
  import { cn } from '$lib/utils'
  import { Draggable } from '@fullcalendar/interaction'
  import { CalendarPlus, GripVertical, Search } from '@lucide/svelte'
  import { offerKey, stateBadge, type LabelMaps } from './exam-planning'

  let {
    offers,
    maps,
    studyPrograms,
    canEdit,
    onCreate
  }: {
    /** Offers without an appointment yet; planned ones are left out by the backend. */
    offers: ExamOffer[]
    maps: LabelMaps
    studyPrograms: StudyProgram[]
    canEdit: boolean
    onCreate: (offer: ExamOffer) => void
  } = $props()

  let search = $state('')

  /** Offers matching the search, grouped by exam in the server's order. */
  const groups = $derived.by(() => {
    const query = search.trim().toLocaleLowerCase('de')
    const visible = offers.filter(
      (o) =>
        !query ||
        `${o.examName} ${o.firstExaminers.map((e) => e.label).join(' ')} ${o.modules.map((m) => `${m.title} ${m.abbrev}`).join(' ')}`
          .toLocaleLowerCase('de')
          .includes(query)
    )
    return [...Map.groupBy(visible, (o) => o.exam).values()]
  })

  /** Distinct first examiners of the offers of one exam. */
  const examiners = (group: ExamOffer[]) =>
    [...new Map(group.flatMap((o) => o.firstExaminers).map((e) => [e.id, e.label])).values()].join(
      ', '
    )

  const label = (id: string) => maps.identities.get(id) ?? id
  const methods = (ids: string[]) => ids.map((m) => maps.methods.get(m) ?? m).join(', ')
  const fmtPeriod = ({ start, end }: ExamOffer['sources'][number]['registrationPeriod']) =>
    `${start ? fmtDate(start) : 'offen'} – ${end ? fmtDate(end) : 'offen'}`

  /**
   * One line per source if their examiners, assessment methods or registration periods disagree, showing the
   * differing fields only, else an empty string. Sources of an exam shared by several modules differ in their module
   * by design, so the module is only shown to tell them apart.
   */
  function differences(offer: ExamOffer): string {
    const rows = offer.sources.map((source) => ({
      source,
      values: {
        Prüfende: `${label(source.firstExaminer)}, ${label(source.secondExaminer)}`,
        Prüfungsformen: methods(source.assessmentMethods.toSorted()),
        Anmeldezeitraum: fmtPeriod(source.registrationPeriod)
      }
    }))
    const fields = (['Prüfende', 'Prüfungsformen', 'Anmeldezeitraum'] as const).filter(
      (field) => new Set(rows.map((r) => r.values[field])).size > 1
    )
    if (!fields.length) return ''
    const modulesDiffer = new Set(offer.sources.map((source) => source.module)).size > 1
    return rows
      .map(({ source, values }) =>
        [
          `${fmtExamPO({ po: source.po, specialization: null }, studyPrograms)} (Liste vom ${fmtDate(source.date)})`,
          ...(modulesDiffer ? [`Modul: ${source.moduleTitle} (${source.moduleAbbrev})`] : []),
          ...fields.map((field) => `${field}: ${values[field]}`)
        ].join('; ')
      )
      .join('\n')
  }

  let listEl = $state<HTMLElement>()

  // Offers dragged into the calendar show a one-hour appointment at the hovered slot.
  $effect(() => {
    if (!canEdit || !listEl) return
    const draggable = new Draggable(listEl, {
      itemSelector: '[data-offer-key]',
      minDistance: 5,
      eventData: (el) => {
        const offer = offers.find((o) => offerKey(o) === el.dataset.offerKey)
        return {
          title: offer ? `${offer.examName} (${maps.phases.get(offer.phase) ?? offer.phase})` : '',
          duration: '01:00',
          color: EXAM_COLOR,
          create: false
        }
      }
    })
    return () => draggable.destroy()
  })
</script>

<section aria-labelledby="exam-pool-title" class="flex min-h-0 flex-1 flex-col">
  <div class="space-y-3 border-b p-4">
    <div class="flex flex-wrap items-baseline justify-between gap-x-3">
      <h2 id="exam-pool-title" class="text-base font-semibold">Prüfungen</h2>
      <p class="text-muted-foreground text-xs">{offers.length} zu planen</p>
    </div>
    <div class="relative">
      <Search
        class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Prüfung, Prüfende oder Modul suchen …"
        class="h-9 pl-9"
        bind:value={search}
        aria-label="Prüfungen durchsuchen"
      />
    </div>
  </div>

  {#if groups.length}
    <ul bind:this={listEl} class="min-h-0 flex-1 divide-y overflow-y-auto">
      {#each groups as group (group[0].exam)}
        <li class="px-4 py-3">
          <p class="text-sm font-medium wrap-anywhere">
            {group[0].examName}
            <span class="text-muted-foreground font-normal">{examiners(group)}</span>
          </p>
          <ul class="mt-1.5 space-y-1">
            {#each group as offer (offerKey(offer))}
              {@const diffs = differences(offer)}
              {@const phase = maps.phases.get(offer.phase) ?? offer.phase}
              <!-- the whole row is the drag source, the grip only shows that it can be moved -->
              <li
                data-offer-key={canEdit ? offerKey(offer) : undefined}
                title={canEdit
                  ? 'In den Kalender ziehen, um einen einstündigen Termin anzulegen'
                  : undefined}
                class={cn(
                  'flex items-center gap-1.5 rounded-md border border-transparent py-1 pr-1 pl-1.5',
                  canEdit &&
                    'group/offer hover:border-border hover:bg-muted cursor-grab transition-colors select-none active:cursor-grabbing'
                )}
              >
                {#if canEdit}
                  <GripVertical
                    class="text-muted-foreground/60 group-hover/offer:text-foreground size-4 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                {/if}
                <span class="min-w-0 flex-1 truncate text-sm">{phase}</span>
                {#if diffs}
                  <Badge variant="outline" class={cn(stateBadge.warning, 'shrink-0')} title={diffs}
                    >Abweichung</Badge
                  >
                {/if}
                {#if canEdit}
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-7 shrink-0 cursor-pointer"
                    aria-label={`Termin für ${offer.examName} (${phase}) anlegen`}
                    title="Termin anlegen"
                    onclick={() => onCreate(offer)}
                  >
                    <CalendarPlus aria-hidden="true" />
                  </Button>
                {/if}
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="text-muted-foreground p-6 text-center text-sm">
      {#if offers.length}
        Keine Prüfung passt zur Suche.
      {:else}
        Alle Prüfungen dieser Auswahl sind geplant, oder die veröffentlichten Prüfungslisten
        enthalten keine. Die Auswahl lässt sich in den Einstellungen anpassen.
      {/if}
    </div>
  {/if}
</section>
