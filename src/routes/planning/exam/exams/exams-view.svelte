<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { ModulePreviewPlaceholder } from '$lib/components/module-detail'
  import TablePagination from '$lib/components/table-pagination.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import { createSvelteTable } from '$lib/components/ui/data-table/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import type { Exam, ExamModule } from '$lib/schemas/exams'
  import { getErrorMessage } from '$lib/errors'
  import { cn } from '$lib/utils'
  import {
    Check,
    ChevronRight,
    CircleCheck,
    LoaderCircle,
    Merge,
    Plus,
    Search,
    SquarePen,
    Trash2,
    TriangleAlert
  } from '@lucide/svelte'
  import { getCoreRowModel, getPaginationRowModel } from '@tanstack/table-core'
  import { isHttpError } from '@sveltejs/kit'
  import { untrack, type Snippet } from 'svelte'
  import { MediaQuery, SvelteSet } from 'svelte/reactivity'
  import OptionPicker from '../(components)/option-picker.svelte'
  import { plural, stateBadge } from '../(components)/exam-planning'
  import RefreshButton from '../(components)/refresh-button.svelte'
  import ExamPanel, { type ExamPanelMode, type ModuleOption } from './exam-panel.svelte'
  import MergeExamsDialog from './merge-exams-dialog.svelte'
  import { deleteExam, getExams, updateExam } from './exams.remote'

  let { header }: { header: Snippet } = $props()

  const data = $derived(await getExams())

  const normalize = (text: string) => text.trim().toLocaleLowerCase('de')

  /** Every module of any exam and every module without exam, with its number of exams. */
  const modules = $derived.by(() => {
    const assigned = Map.groupBy(
      data.exams.flatMap((e) => e.modules),
      (m) => m.id
    )
    return new Map<string, ModuleOption>(
      [...data.modulesWithoutExam, ...[...assigned.values()].map(([m]) => m)]
        .toSorted((a, b) => a.title.localeCompare(b.title, 'de'))
        .map((m) => [m.id, { ...m, examCount: assigned.get(m.id)?.length ?? 0 }])
    )
  })

  const searchTexts = $derived(
    new Map(
      data.exams.map((e) => [
        e.id,
        normalize(
          `${e.name} ${e.modules.map((m) => `${m.title} ${m.abbrev} ${m.firstExaminer.label}`).join(' ')}`
        )
      ])
    )
  )
  let search = $state('')
  let pagination = $state({ pageIndex: 0, pageSize: 25 })

  /** Exams matching the search. */
  const visible = $derived.by(() => {
    const query = normalize(search)
    return query ? data.exams.filter((e) => searchTexts.get(e.id)!.includes(query)) : data.exams
  })

  const table = createSvelteTable<Exam>({
    get data() {
      return visible
    },
    columns: [],
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // the page is kept when commands refresh the exams and reset on search and filter changes
    autoResetPageIndex: false,
    onPaginationChange: (update) =>
      (pagination = typeof update === 'function' ? update(pagination) : update),
    state: {
      get pagination() {
        return pagination
      }
    }
  })
  const resetPage = () => (pagination = { ...pagination, pageIndex: 0 })

  const examiners = (exam: Exam) =>
    [
      ...new Map(exam.modules.map((m) => [m.firstExaminer.id, m.firstExaminer.label])).values()
    ].join(', ')
  const examOptions = $derived(
    data.exams.map((e) => ({
      id: e.id,
      label: e.name,
      hint: e.modules.map((m) => m.abbrev).join(', ') || 'Ohne Module',
      keywords: e.modules.map((m) => m.title)
    }))
  )

  let errorMessage = $state<string>()
  let showWithout = $state(false)

  // side panel

  const desktop = new MediaQuery('(min-width: 64rem)')
  let mode = $state<ExamPanelMode | null>(null)
  /** Remounts the panel for another exam, so its drafts start fresh. */
  let panelKey = $state(0)
  let dirty = $state(false)
  let pendingAction = $state<(() => void) | undefined>()
  const editedId = $derived(mode?.kind === 'edit' ? mode.exam.id : null)
  // Reconcile only when the list changes; creation already supplies the saved exam.
  $effect.pre(() => {
    const exams = data.exams
    untrack(() => {
      if (mode?.kind !== 'edit') return
      const id = mode.exam.id
      const exam = exams.find((e) => e.id === id)
      mode = exam ? { kind: 'edit', exam } : null
    })
  })

  /** Module shown in the side panel instead of an exam. */
  let previewId = $state<string | null>(null)

  function openPanel(next: ExamPanelMode | null) {
    afterDiscard(() => {
      mode = next
      previewId = null
      panelKey++
    })
  }

  function openPreview(id: string) {
    afterDiscard(() => {
      mode = null
      previewId = id
    })
  }

  beforeNavigate((navigation) => {
    if (!dirty) return
    navigation.cancel()
    const url = navigation.type !== 'leave' && navigation.to?.url
    if (url) pendingAction = () => goto(url)
  })

  function afterDiscard(action: () => void) {
    if (dirty) pendingAction = action
    else action()
  }

  function discardAndContinue() {
    dirty = false
    pendingAction?.()
    pendingAction = undefined
  }

  const createFor = (m: ExamModule) => openPanel({ kind: 'create', name: m.title, modules: [m.id] })

  // modules without exam

  let adding = $state<string>()

  /** Adds the module to an existing exam, which removes it from the modules without exam. */
  async function addTo(module: ExamModule, examId: string) {
    const exam = data.exams.find((e) => e.id === examId)
    if (adding || !exam) return
    adding = module.id
    try {
      await updateExam({
        id: exam.id,
        name: exam.name,
        modules: [...exam.modules.map((m) => m.id), module.id]
      })
    } catch (e) {
      errorMessage = getErrorMessage(e)
    } finally {
      adding = undefined
    }
  }

  // selection and merge

  const selected = new SvelteSet<string>()
  const selectedExams = $derived(data.exams.filter((e) => selected.has(e.id)))
  const setSelected = (id: string, value: boolean) =>
    value ? selected.add(id) : selected.delete(id)

  let mergeOpen = $state(false)
  /** Selection when the merge dialog opened, kept while it closes. */
  let mergeSelection = $state.raw<Exam[]>([])
  let merged = $state(false)

  function openMerge() {
    if (selectedExams.length < 2) return
    afterDiscard(() => {
      mode = null
      mergeSelection = selectedExams
      mergeOpen = true
    })
  }

  function onMerged(target: Exam) {
    selected.clear()
    // the panel shows the merged exam if it showed one of the merged ones
    if (editedId && mergeSelection.some((e) => e.id === editedId))
      openPanel({ kind: 'edit', exam: target })
    merged = true
    setTimeout(() => (merged = false), 2000)
  }

  // deletion

  let deleting = $state<Exam | null>(null)
  let deleteError = $state<string>()
  let referenced = $state(false)
  let deletingBusy = $state(false)

  function confirmDelete(exam: Exam) {
    deleteError = undefined
    referenced = false
    deleting = exam
  }

  async function remove() {
    const exam = deleting
    if (!exam || deletingBusy) return
    deletingBusy = true
    try {
      await deleteExam(exam.id)
      selected.delete(exam.id)
      deleting = null
    } catch (e) {
      deleteError = getErrorMessage(e)
      referenced = isHttpError(e) && e.status === 409
    } finally {
      deletingBusy = false
    }
  }

  /** Selects the referenced exam for merging instead of deleting it. */
  function selectForMerge() {
    if (deleting) selected.add(deleting.id)
    deleting = null
  }
</script>

{#snippet moduleLine(m: ExamModule)}
  <span class="text-muted-foreground font-mono text-xs">{m.abbrev}</span>
  <button
    type="button"
    class="text-left wrap-anywhere hover:underline"
    aria-expanded={previewId === m.id}
    onclick={() => openPreview(m.id)}
  >
    {m.title}
  </button>
  <span class="text-muted-foreground text-xs whitespace-nowrap">· {m.ects} ECTS</span>
  {#if m.status !== 'active'}
    <Badge variant="outline" class={cn('font-normal', stateBadge.warning)}>Inaktiv</Badge>
  {/if}
{/snippet}

{#snippet panel(closable: boolean)}
  {#if mode}
    {#key panelKey}
      <ExamPanel
        {mode}
        {modules}
        {closable}
        bind:dirty
        onClose={() => openPanel(null)}
        onCreated={(exam) => (mode = { kind: 'edit', exam })}
        onDelete={confirmDelete}
      />
    {/key}
  {/if}
{/snippet}

<div class="flex min-h-0 flex-1 gap-6">
  <div class="mx-auto w-full max-w-6xl min-w-0 flex-1 space-y-8">
    {@render header()}

    <ErrorMessage bind:message={errorMessage} />

    <section class="bg-muted/25 rounded-xl border" aria-label="Stand der Prüfungen">
      <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div class="flex items-start gap-3" role="status" aria-live="polite">
          <div
            class="bg-background flex size-10 shrink-0 items-center justify-center rounded-lg border"
          >
            {#if data.modulesWithoutExam.length}
              <TriangleAlert class="size-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            {:else}
              <CircleCheck
                class="size-5 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
            {/if}
          </div>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold tracking-tight">
              {plural(data.exams.length, 'Prüfung', 'Prüfungen')}
            </h2>
            {#if data.modulesWithoutExam.length}
              <button
                type="button"
                class="flex items-center gap-1 text-sm text-amber-800 underline-offset-4 hover:underline dark:text-amber-300"
                aria-expanded={showWithout}
                aria-controls="modules-without-exam"
                onclick={() => (showWithout = !showWithout)}
              >
                <ChevronRight
                  class={cn(
                    'size-4 transition-transform motion-reduce:transition-none',
                    showWithout && 'rotate-90'
                  )}
                  aria-hidden="true"
                />
                {plural(data.modulesWithoutExam.length, 'Modul', 'Module')} ohne Prüfung
              </button>
            {:else}
              <p class="text-muted-foreground text-sm">
                Alle Module mit eigener Prüfung sind zugeordnet
              </p>
            {/if}
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <RefreshButton
            refresh={() => getExams().refresh()}
            onError={(message) => (errorMessage = message)}
          />
          <Button onclick={() => openPanel({ kind: 'create', name: '', modules: [] })}>
            <Plus aria-hidden="true" />
            Prüfung anlegen
          </Button>
        </div>
      </div>

      {#if showWithout && data.modulesWithoutExam.length}
        <ul id="modules-without-exam" class="divide-y border-t" aria-label="Module ohne Prüfung">
          {#each data.modulesWithoutExam as m (m.id)}
            <li class="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:px-6">
              <div class="min-w-0 flex-1 text-sm">
                <p class="flex flex-wrap items-baseline gap-x-1.5">{@render moduleLine(m)}</p>
                <p class="text-muted-foreground text-xs">{m.firstExaminer.label}</p>
              </div>
              <div class="flex items-center gap-2">
                <Button variant="ghost" size="sm" onclick={() => createFor(m)}>
                  <Plus aria-hidden="true" />
                  <span class="hidden lg:inline">Prüfung anlegen</span>
                  <span class="sr-only lg:hidden">Prüfung für {m.title} anlegen</span>
                </Button>
                <OptionPicker
                  class="w-52"
                  options={examOptions}
                  onSelect={(examId) => addTo(m, examId)}
                  disabled={!examOptions.length}
                  label={adding === m.id ? 'Wird hinzugefügt …' : 'Zu Prüfung hinzufügen'}
                />
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <Card.Root class="gap-0 overflow-hidden shadow-none">
      <Card.Header class="pb-5">
        <div class="relative w-full sm:max-w-md">
          <Search
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Prüfung, Modul oder Erstprüfende suchen …"
            class="h-9 pl-9"
            bind:value={search}
            oninput={resetPage}
            aria-label="Prüfungen durchsuchen"
          />
        </div>
      </Card.Header>
      {#if visible.length}
        <Table.Root class="table-fixed" aria-label="Prüfungen">
          <Table.Header>
            <Table.Row class="bg-muted/40 hover:bg-muted/40">
              <Table.Head scope="col" class="w-12 pl-4 lg:pl-6">
                <span class="sr-only">Auswahl</span>
              </Table.Head>
              <Table.Head scope="col" class="md:w-1/4">Prüfung</Table.Head>
              <Table.Head scope="col" class="hidden md:table-cell">Module</Table.Head>
              <Table.Head scope="col" class="hidden w-48 md:table-cell">Erstprüfende</Table.Head>
              <Table.Head scope="col" class="w-24 pr-4 lg:w-60 lg:pr-6">
                <span class="sr-only">Aktionen</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each table.getRowModel().rows as { original: exam } (exam.id)}
              <Table.Row
                data-state={selected.has(exam.id) ? 'selected' : undefined}
                class={editedId === exam.id ? 'bg-muted' : ''}
              >
                <Table.Cell class="py-4 pl-4 align-top lg:pl-6">
                  <Checkbox
                    class="mt-0.5"
                    checked={selected.has(exam.id)}
                    onCheckedChange={(checked) => setSelected(exam.id, checked)}
                    aria-label="{exam.name} auswählen"
                  />
                </Table.Cell>
                <Table.Cell class="py-4 align-top whitespace-normal">
                  <p class="font-medium wrap-anywhere">{exam.name}</p>
                  {#if !exam.modules.length}
                    <Badge variant="outline" class={cn('mt-1 font-normal', stateBadge.warning)}
                      >Ohne Module</Badge
                    >
                  {/if}
                  <div class="text-muted-foreground mt-1 space-y-0.5 text-xs md:hidden">
                    {#each exam.modules as m (m.id)}
                      <p>
                        {m.abbrev} · {m.title}{m.status !== 'active' ? ' (inaktiv)' : ''}
                      </p>
                    {/each}
                    {#if exam.modules.length}<p>{examiners(exam)}</p>{/if}
                  </div>
                </Table.Cell>
                <Table.Cell class="hidden py-4 align-top whitespace-normal md:table-cell">
                  <ul class="space-y-1 text-sm">
                    {#each exam.modules as m (m.id)}
                      <li class="flex flex-wrap items-baseline gap-x-1.5">
                        {@render moduleLine(m)}
                      </li>
                    {/each}
                  </ul>
                </Table.Cell>
                <Table.Cell class="hidden py-4 align-top text-sm whitespace-normal md:table-cell">
                  {examiners(exam)}
                </Table.Cell>
                <Table.Cell class="py-2.5 pr-4 text-right align-top whitespace-nowrap lg:pr-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    title="Bearbeiten"
                    onclick={() => openPanel({ kind: 'edit', exam })}
                    aria-label="{exam.name} bearbeiten"
                    aria-expanded={editedId === exam.id}
                  >
                    <SquarePen aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Löschen"
                    onclick={() => confirmDelete(exam)}
                    aria-label="{exam.name} löschen"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
        <div class="border-t px-4 py-3 lg:px-6">
          <TablePagination {table} pages={['25', '50', '100', 'Alle']} />
        </div>
      {:else}
        <Empty.Root class="border-t py-8 md:py-10">
          <Empty.Header>
            <CircleCheck class="text-muted-foreground mx-auto size-5" aria-hidden="true" />
            <Empty.Title class="text-sm">
              {data.exams.length ? 'Keine Treffer' : 'Keine Prüfungen'}
            </Empty.Title>
            <Empty.Description>
              {data.exams.length
                ? 'Keine Prüfung passt zu Suche und Filter.'
                : 'Es wurde noch keine Prüfung angelegt.'}
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      {/if}
    </Card.Root>

    {#if data.exams.length}
      <div
        class="bg-background/95 supports-backdrop-filter:bg-background/80 sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border p-3 pl-5 shadow-lg backdrop-blur"
      >
        <p class="text-sm" aria-live="polite">
          <span class="font-semibold tabular-nums">{selectedExams.length}</span>
          <span class="text-muted-foreground"
            >{selectedExams.length === 1 ? 'Prüfung' : 'Prüfungen'} ausgewählt</span
          >
        </p>
        {#if selected.size}
          <Button variant="ghost" size="sm" onclick={() => selected.clear()}
            >Auswahl aufheben</Button
          >
        {/if}
        <Button class="ml-auto" disabled={selectedExams.length < 2 && !merged} onclick={openMerge}>
          {#if merged}
            <Check aria-hidden="true" />
          {:else}
            <Merge aria-hidden="true" />
          {/if}
          <span class="grid justify-items-start" aria-live="polite">
            <span class={cn('col-start-1 row-start-1', merged && 'invisible')}>Zusammenführen</span>
            <span class={cn('col-start-1 row-start-1', !merged && 'invisible')}
              >Zusammengeführt</span
            >
          </span>
        </Button>
      </div>
    {/if}
  </div>

  {#if desktop.current && previewId}
    <aside
      aria-label="Modulvorschau"
      class="sticky top-6 h-[calc(100vh-7rem)] w-[min(42vw,48rem)] shrink-0 overflow-hidden border-l"
    >
      <ModulePreviewPlaceholder id={previewId} onClose={() => (previewId = null)} />
    </aside>
  {:else if desktop.current && mode}
    <aside
      aria-label="Prüfung"
      class="bg-background sticky top-6 flex h-[calc(100vh-7rem)] w-[26rem] shrink-0 flex-col overflow-hidden rounded-xl border"
    >
      {@render panel(true)}
    </aside>
  {/if}
</div>

{#if !desktop.current}
  <Sheet.Root
    open={mode !== null || previewId !== null}
    onOpenChange={(open) => !open && (previewId ? (previewId = null) : openPanel(null))}
  >
    <Sheet.Content side="right" class="flex w-full flex-col gap-0 p-0 sm:max-w-none">
      {#if previewId}
        <Sheet.Title class="sr-only">Modulvorschau</Sheet.Title>
        <Sheet.Description class="sr-only">Aktueller Stand des Moduls</Sheet.Description>
        <ModulePreviewPlaceholder id={previewId} />
      {:else}
        <Sheet.Title class="sr-only">Prüfung</Sheet.Title>
        <Sheet.Description class="sr-only">Name und Module der Prüfung</Sheet.Description>
        {@render panel(false)}
      {/if}
    </Sheet.Content>
  </Sheet.Root>
{/if}

{#key mergeSelection}
  <MergeExamsDialog bind:open={mergeOpen} exams={mergeSelection} {onMerged} />
{/key}

<Dialog.Root
  open={pendingAction !== undefined}
  onOpenChange={(open) => !open && (pendingAction = undefined)}
>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Änderungen verwerfen</Dialog.Title>
      <Dialog.Description>
        Die geöffnete Prüfung hat nicht gespeicherte Änderungen an Name oder Modulen.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (pendingAction = undefined)}
        >Weiter bearbeiten</Button
      >
      <Button variant="destructive" onclick={discardAndContinue}>Verwerfen</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root open={deleting !== null} onOpenChange={(open) => !open && (deleting = null)}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Prüfung löschen</Dialog.Title>
      <Dialog.Description>
        Die Prüfung {deleting?.name} wird gelöscht; ihre Module bleiben unverändert. Prüfungen in Terminen
        oder veröffentlichten Prüfungslisten können nicht gelöscht werden.
      </Dialog.Description>
    </Dialog.Header>
    {#if deleteError}
      <div class="space-y-1 text-sm" role="alert">
        <p class="text-destructive">{deleteError}</p>
        {#if referenced}
          <p class="text-muted-foreground">
            Führen Sie die Prüfung stattdessen mit einer anderen zusammen, damit alle Verweise
            erhalten bleiben.
          </p>
        {/if}
      </div>
    {/if}
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (deleting = null)}>Abbrechen</Button>
      {#if referenced}
        <Button onclick={selectForMerge}>
          <Merge aria-hidden="true" />
          Zum Zusammenführen auswählen
        </Button>
      {:else}
        <Button variant="destructive" onclick={remove}>
          {#if deletingBusy}
            <LoaderCircle class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {:else}
            <Trash2 aria-hidden="true" />
          {/if}
          Löschen
        </Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
