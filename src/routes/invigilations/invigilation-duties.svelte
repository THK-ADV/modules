<script lang="ts">
  import { resolve } from '$app/paths'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import {
    fmtDate,
    fmtDateFull,
    fmtDateTime,
    fmtList,
    fmtPersonName,
    fmtPersonInitialFirst,
    fmtTime
  } from '$lib/formats'
  import type { InvigilationEntry } from '$lib/schemas/exam-planning'
  import { examRoomLabel } from '$lib/types/exam-planning'
  import { cn } from '$lib/utils'
  import {
    CalendarX2,
    ChevronsDown,
    History,
    Hourglass,
    LoaderCircle,
    UserRound,
    UsersRound
  } from '@lucide/svelte'
  import type { Snippet } from 'svelte'
  import OptionPicker from '../planning/exam/(components)/option-picker.svelte'
  import {
    getInvigilationLabels,
    getPastInvigilations,
    getUpcomingInvigilations
  } from './invigilations.remote'

  type Room = InvigilationEntry['rooms'][number]
  interface View {
    /** Identity id whose duties are shown, `null` for all appointments, `undefined` for me. */
    filter: string | null | undefined
    /** Shows ended appointments, newest first, instead of upcoming ones. */
    past: boolean
    /** Loaded pages of the past view. */
    pages: number
  }

  let {
    me,
    header
  }: {
    me: string
    header: Snippet
  } = $props()

  let filter = $state<View['filter']>()
  let past = $state(false)
  let pages = $state(1)
  /** A past page needed by a change of the view, or by "Weitere laden", is loading. */
  let loading = $state<'view' | 'more'>()

  const person = $derived(filter === undefined ? me : filter)

  const [upcoming, labels] = $derived(
    await Promise.all([getUpcomingInvigilations(), getInvigilationLabels()])
  )
  // `change` loads the page a switch needs first, so this resolves from the cache.
  const chunks = $derived(
    past
      ? await Promise.all(
          Array.from({ length: pages }, (_, page) => getPastInvigilations({ person, page }))
        )
      : []
  )

  /** Shown appointments: past ones as loaded, upcoming ones filtered by person here. */
  const entries = $derived.by(() => {
    if (past) {
      // An appointment that ends between two page loads moves to the next page; drop it there.
      return [...new Map(chunks.flatMap((c) => c.entries).map((e) => [e.id, e])).values()]
    }
    return person === null
      ? upcoming.entries
      : upcoming.entries.filter((e) => e.rooms.some((r) => r.invigilators.includes(person)))
  })
  /** Last publication time of the exam plan per semester. */
  const publishedAt = $derived<Record<string, string>>(
    past ? Object.assign({}, ...chunks.map((c) => c.publishedAt)) : upcoming.publishedAt
  )
  const more = $derived(chunks.at(-1)?.more ?? false)

  /**
   * Changes the person, the period or the number of pages. Upcoming appointments are filtered without a request; a
   * change that shows past ones first loads its new page, with a spinner meanwhile, so the view then switches at once.
   */
  async function change(to: Partial<View>) {
    if (loading) return
    const next: View = { filter, past, pages: 1, ...to }
    if (next.past) {
      loading = to.pages ? 'more' : 'view'
      try {
        await getPastInvigilations({
          person: next.filter === undefined ? me : next.filter,
          page: next.pages - 1
        })
      } catch {
        // The view's own query shows the error after the switch.
      }
      loading = undefined
    }
    ;({ filter, past, pages } = next)
  }

  const identityById = $derived(new Map(labels.identities.map((i) => [i.id, i])))
  const personOptions = $derived(
    labels.identities
      .flatMap((i) => ('firstname' in i && (past || i.isActive || i.id === person) ? [i] : []))
      .map((p) => ({ id: p.id, label: fmtPersonName(p), keywords: [p.abbreviation] }))
      .toSorted((a, b) => a.label.localeCompare(b.label, 'de'))
  )

  /** Full name of persons, the label of other identities, the id of unknown ones. */
  function name(id: string) {
    const i = identityById.get(id)
    if (!i) return id
    return 'firstname' in i ? fmtPersonName(i) : i.label
  }
  /** `V. Nachname` of persons, so that commas in lists only separate people. */
  function short(id: string) {
    const i = identityById.get(id)
    if (!i) return id
    return 'firstname' in i ? fmtPersonInitialFirst(i) : i.label
  }

  const personName = $derived(person === null ? 'Alle Personen' : name(person))
  const isMe = $derived(person === me)

  const semesterName = (id: string) => {
    const [kind, year] = id.split('_')
    return `${kind === 'wise' ? 'Wintersemester' : 'Sommersemester'} ${year}`
  }

  interface Row {
    entry: InvigilationEntry
    day: string
    running: boolean
    /** Distinct first examiners of the modules. */
    examiners: string[]
    /** Rooms of the selected person, all rooms without one. */
    main: Room[]
    /** Further rooms of a selected person's appointment. */
    others: Room[]
  }

  /** Appointments grouped by phase and day in their order, so past ones run newest first. */
  const view = $derived.by(() => {
    const now = Date.now()
    const today = fmtDate(new Date(now))
    const tomorrow = fmtDate(new Date(now + 86_400_000))
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to this computation
    const phases = new Map<
      string,
      {
        key: string
        label: string
        publishedAt: string | undefined
        days: { day: string; rows: Row[] }[]
      }
    >()
    const mine = (r: Room) => person === null || r.invigilators.includes(person)
    for (const entry of entries) {
      // The upcoming ones are loaded once, so some may have ended since.
      if (!past && Date.parse(entry.end) <= now) continue
      const date = fmtDate(entry.start)
      const relative = date === today ? 'Heute, ' : date === tomorrow ? 'Morgen, ' : ''
      const row: Row = {
        entry,
        day: relative + fmtDateFull(entry.start),
        running: !past && Date.parse(entry.start) <= now,
        examiners: [...new Set(entry.modules.flatMap((m) => m.firstExaminer ?? []))],
        main: entry.rooms.filter(mine),
        others: entry.rooms.filter((r) => !mine(r))
      }
      const key = `${entry.semester}/${entry.phase}`
      let phase = phases.get(key)
      if (!phase) {
        const label = labels.examPhases.find((p) => p.id === entry.phase)?.label ?? entry.phase
        phase = {
          key,
          label: `${semesterName(entry.semester)}, ${label}`,
          publishedAt: publishedAt[entry.semester],
          days: []
        }
        phases.set(key, phase)
      }
      const last = phase.days.at(-1)
      if (last?.day === row.day) last.rows.push(row)
      else phase.days.push({ day: row.day, rows: [row] })
    }
    return [...phases.values()]
  })

  /** The first upcoming appointment; a selected person's is emphasised in the list. */
  const next = $derived(past ? undefined : view[0]?.days[0].rows[0])
</script>

{#snippet room(r: Room)}
  <p class="text-sm">
    <span class="font-semibold">{r.abbrev}</span>
    <span class="text-muted-foreground">{r.label}</span>
  </p>
  {#if r.partitionBy && r.partitionValue}
    <p class="text-xs">
      <span class="text-muted-foreground">{r.partitionBy}</span>
      <span class="font-medium">{r.partitionValue}</span>
    </p>
  {/if}
{/snippet}

{#snippet people(ids: string[], label?: string)}
  <p class="text-xs">
    {#if label}<span class="text-muted-foreground">{label}</span>{/if}
    {fmtList(ids.map(short))}
  </p>
{/snippet}

<div class="mx-auto w-full max-w-5xl space-y-6">
  {@render header()}

  <!-- The view switches once `change` has loaded it, so the selected tab always matches the list. -->
  <Tabs.Root
    bind:value={() => (past ? 'past' : 'upcoming'), (v) => change({ past: v === 'past' })}
    class="space-y-6"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Label for="invigilation-person" class="sr-only">Klausurtermine anzeigen von</Label>
      <ButtonGroup.Root class="max-sm:w-full">
        <OptionPicker
          id="invigilation-person"
          class="min-w-0 flex-1 sm:w-72 sm:flex-none"
          options={personOptions}
          selected={person === null ? [] : [person]}
          label={isMe ? `${personName} (ich)` : personName}
          placeholder="Person suchen …"
          onSelect={(id) => change({ filter: id === me ? undefined : id })}
        />
        {#if !isMe}
          <Button
            variant="outline"
            class="h-9"
            title="Meine Aufsichten"
            onclick={() => change({ filter: undefined })}
          >
            <UserRound aria-hidden="true" /><span class="max-sm:sr-only">Meine Aufsichten</span>
          </Button>
        {/if}
        {#if person !== null}
          <Button
            variant="outline"
            class="h-9"
            title="Alle anzeigen"
            onclick={() => change({ filter: null })}
          >
            <UsersRound aria-hidden="true" /><span class="max-sm:sr-only">Alle anzeigen</span>
          </Button>
        {/if}
      </ButtonGroup.Root>
      <Separator orientation="vertical" class="h-6 min-h-0 max-sm:hidden" />
      <Tabs.List class="h-9" aria-label="Zeitraum">
        <Tabs.Trigger value="upcoming" class="gap-2 py-1 [&_svg]:size-4">
          <Hourglass aria-hidden="true" />Anstehend
        </Tabs.Trigger>
        <Tabs.Trigger value="past" class="gap-2 py-1 [&_svg]:size-4" aria-busy={loading === 'view'}>
          {#if loading === 'view'}
            <LoaderCircle class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {:else}
            <History aria-hidden="true" />
          {/if}
          Vergangen
        </Tabs.Trigger>
      </Tabs.List>
    </div>

    <Tabs.Content value={past ? 'past' : 'upcoming'} class="mt-0 space-y-6">
      {#each view as phase (phase.key)}
        <section class="space-y-3" aria-label={phase.label}>
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 class="text-base font-semibold">{phase.label}</h2>
            {#if phase.publishedAt}
              <p class="text-muted-foreground text-xs">
                Aktualisiert am <time datetime={phase.publishedAt}
                  >{fmtDateTime(phase.publishedAt)} Uhr</time
                >
              </p>
            {/if}
          </div>
          <Card.Root class="gap-0 overflow-hidden py-0 shadow-none">
            {#each phase.days as { day, rows } (day)}
              <h3 class="bg-muted/40 border-b px-4 py-2 text-sm font-semibold lg:px-5">{day}</h3>
              <ul class="divide-y border-b last:border-b-0" aria-label="Klausurtermine: {day}">
                {#each rows as { entry, running, examiners, main, others } (entry.id)}
                  {@const isNext = person !== null && entry.id === next?.entry.id}
                  <li
                    class={cn(
                      'grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-4 lg:grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,15rem)] lg:gap-x-6 lg:px-5',
                      isNext &&
                        'bg-sky-50/70 shadow-[inset_3px_0_0_var(--color-sky-600)] dark:bg-sky-400/5 dark:shadow-[inset_3px_0_0_var(--color-sky-400)]'
                    )}
                  >
                    <div>
                      <p class="text-sm font-medium tabular-nums">
                        {fmtTime(entry.start)}<span class="text-muted-foreground font-normal">
                          – {fmtTime(entry.end)}</span
                        >
                      </p>
                      {#if running || isNext}
                        <p class="mt-1.5 text-xs font-medium text-sky-800 dark:text-sky-300">
                          {running ? 'Läuft' : 'Nächste'}
                        </p>
                      {/if}
                    </div>

                    <!-- Rooms sit side by side as far as the column allows; a single one takes all of it. -->
                    <div
                      class="col-start-2 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-x-6 gap-y-3"
                    >
                      {#each main as r (r)}
                        {@const invigilators =
                          person === null
                            ? r.invigilators
                            : r.invigilators.filter((id) => id !== person)}
                        <div class="min-w-0 space-y-1">
                          {@render room(r)}
                          {#if invigilators.length}
                            {@render people(
                              invigilators,
                              person === null ? 'Aufsicht' : 'Mit im Raum'
                            )}
                          {:else if person !== null}
                            <p class="text-xs">
                              <span class="text-muted-foreground">Mit im Raum</span> niemand
                            </p>
                          {:else}
                            <p class="text-xs text-amber-700 dark:text-amber-400">
                              Keine Aufsicht eingeteilt
                            </p>
                          {/if}
                        </div>
                      {:else}
                        <p class="text-sm text-amber-700 dark:text-amber-400">
                          Noch kein Raum zugeordnet
                        </p>
                      {/each}
                    </div>

                    <div class="min-w-0 space-y-1 max-lg:col-start-2">
                      <p class="text-sm font-medium wrap-anywhere">{entry.examName}</p>
                      {#if entry.modules.length}
                        <ul class="flex flex-wrap gap-x-1 text-xs" aria-label="Module">
                          {#each entry.modules as m (m.id)}
                            <li
                              class="after:text-muted-foreground after:content-[','] last:after:content-none"
                            >
                              <a
                                href={resolve('/modules/[id=uuid]', { id: m.id })}
                                target="_blank"
                                rel="noopener"
                                title={m.title}
                                class="text-muted-foreground hover:text-foreground underline decoration-current/30 underline-offset-2 hover:decoration-current"
                                >{m.abbrev}<span class="sr-only"
                                  >: {m.title}, öffnet in neuem Tab</span
                                ></a
                              >
                            </li>
                          {/each}
                        </ul>
                      {/if}
                      {#if examiners.length}
                        {@render people(examiners, 'Prüfende')}
                      {/if}
                    </div>

                    {#if others.length}
                      <div
                        class="text-muted-foreground col-start-2 flex flex-wrap gap-x-2 gap-y-1 text-xs lg:col-end-4"
                      >
                        <span id="others-{entry.id}">Auch in</span>
                        <ul
                          class="flex flex-wrap gap-x-4 gap-y-1"
                          aria-labelledby="others-{entry.id}"
                        >
                          {#each others as r (r)}
                            <li class="flex flex-wrap items-baseline gap-x-1.5">
                              <span class="font-medium">{examRoomLabel(r)}</span>
                              {#if r.invigilators.length}
                                {@render people(r.invigilators)}
                              {:else}
                                ohne Aufsicht
                              {/if}
                            </li>
                          {/each}
                        </ul>
                      </div>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/each}
          </Card.Root>
        </section>
      {:else}
        <Empty.Root class="border py-12">
          <Empty.Header>
            <CalendarX2 class="text-muted-foreground mx-auto size-5" aria-hidden="true" />
            <Empty.Title class="text-sm">
              {#if person === null}
                {past
                  ? 'Noch kein Klausurtermin vorbei'
                  : 'Kein veröffentlichter Klausurtermin steht an'}
              {:else if past}
                {isMe ? 'Sie hatten' : `${personName} hatte`} noch keine Aufsicht
              {:else}
                {isMe ? 'Sie sind' : `${personName} ist`} für keine anstehende Klausur eingeteilt
              {/if}
            </Empty.Title>
            <Empty.Description>
              {#if person === null}
                {past
                  ? 'Klausurtermine erscheinen hier, sobald sie stattgefunden haben.'
                  : 'Klausurtermine erscheinen hier, sobald ein Prüfungsplan veröffentlicht ist.'}
              {:else if past}
                Abgeschlossene Klausurtermine mit {isMe ? 'Ihrer' : 'dieser'} Einteilung erscheinen hier.
              {:else}
                Aufsichten erscheinen hier, sobald ein Prüfungsplan mit {isMe ? 'Ihrer' : 'der'} Einteilung
                veröffentlicht ist.
              {/if}
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      {/each}

      {#if more}
        <div class="flex justify-center">
          <Button
            variant="outline"
            class="w-full sm:w-auto"
            aria-busy={loading === 'more'}
            onclick={() => change({ pages: pages + 1 })}
          >
            {#if loading === 'more'}
              <LoaderCircle class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {:else}
              <ChevronsDown aria-hidden="true" />
            {/if}
            Weitere laden
          </Button>
        </div>
      {/if}
    </Tabs.Content>
  </Tabs.Root>
</div>
