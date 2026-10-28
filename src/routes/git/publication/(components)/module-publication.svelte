<script lang="ts">
  import { resolve } from '$app/paths'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Checkbox } from '$lib/components/ui/checkbox/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import * as Sheet from '$lib/components/ui/sheet/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import * as Table from '$lib/components/ui/table/index.js'
  import { getErrorMessage } from '$lib/errors'
  import { MY_MODULE_ROUTE_ID } from '$lib/routes'
  import {
    ChevronLeft,
    ChevronRight,
    CircleCheck,
    ExternalLink,
    FileDiff,
    GitCompareArrows,
    GitPullRequestArrow,
    RefreshCw,
    Search,
    SquarePen,
    TriangleAlert,
    X
  } from '@lucide/svelte'
  import { isHttpError } from '@sveltejs/kit'
  import { tick, type Snippet } from 'svelte'
  import { MediaQuery, SvelteSet } from 'svelte/reactivity'
  import { getModuleChanges, getPublicationTitle, publishModules } from '../publication.remote'
  import PatchDiffView from './patch-diff-view.svelte'

  let { header }: { header: Snippet } = $props()

  const kinds = {
    added: {
      label: 'Neu',
      class:
        'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300'
    },
    modified: {
      label: 'Geändert',
      class:
        'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300'
    },
    deleted: {
      label: 'Gelöscht',
      class:
        'border-red-200 bg-red-50 text-red-800 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300'
    }
  } as const

  let changes = $state(await getModuleChanges())
  const rows = $derived(
    changes.modules
      .map((module) => ({
        ...module,
        label: module.title ?? module.id,
        ...lineCounts(module.file.diff)
      }))
      .toSorted((a, b) => a.label.localeCompare(b.label, 'de'))
  )
  type Row = (typeof rows)[number]

  let search = $state('')
  const visibleRows = $derived.by(() => {
    const query = search.trim().toLocaleLowerCase('de')
    if (!query) return rows
    return rows.filter((row) =>
      `${row.label} ${row.abbrev ?? ''}`.toLocaleLowerCase('de').includes(query)
    )
  })

  const selected = new SvelteSet<string>()
  const selectedRows = $derived(rows.filter((row) => selected.has(row.id)))
  const allVisibleSelected = $derived(
    visibleRows.length > 0 && visibleRows.every((row) => selected.has(row.id))
  )
  const someVisibleSelected = $derived(visibleRows.some((row) => selected.has(row.id)))

  let refreshing = $state(false)
  let refreshError = $state<string>()

  let viewIndex = $state<number>()
  const viewing = $derived(viewIndex === undefined ? undefined : visibleRows[viewIndex])
  /** Matches the `lg` breakpoint: side panel next to the list from here on, sheet with focus trap below. */
  const desktop = new MediaQuery('(min-width: 64rem)')
  let diffTrigger: HTMLElement | undefined

  let publishing = $state(false)
  let submitting = $state(false)
  let title = $state('')
  let loadingTitle = $state(false)
  let titleError = $state<string>()
  let publishError = $state<string>()
  let mergeRequestUrl = $state<string>()

  function lineCounts(diff: string) {
    let additions = 0
    let deletions = 0
    for (const line of diff.split('\n')) {
      if (line.startsWith('+')) additions++
      else if (line.startsWith('-')) deletions++
    }
    return { additions, deletions }
  }

  function setSelected(id: string, value: boolean) {
    if (value) selected.add(id)
    else selected.delete(id)
  }

  /** Discards the whole work state, as it refers to the old comparison. Selecting is locked until the new one is loaded. */
  async function refresh() {
    if (refreshing || publishing || submitting) return
    refreshing = true
    selected.clear()
    search = ''
    viewIndex = undefined
    title = ''
    titleError = undefined
    publishError = undefined
    mergeRequestUrl = undefined
    refreshError = undefined
    try {
      await getModuleChanges().refresh()
      changes = await getModuleChanges()
    } catch (error) {
      refreshError = getErrorMessage(error)
    } finally {
      refreshing = false
    }
  }

  async function closeDiff() {
    viewIndex = undefined
    await tick()
    diffTrigger?.focus()
  }

  async function openPublish() {
    if (refreshing || submitting || loadingTitle || !selected.size) return
    publishError = undefined
    mergeRequestUrl = undefined
    title = ''
    publishing = true
    await loadTitle()
  }

  async function loadTitle() {
    if (loadingTitle) return
    loadingTitle = true
    titleError = undefined
    try {
      const suggestion = getPublicationTitle()
      await suggestion.refresh()
      title = (await suggestion).title
    } catch (error) {
      titleError = getErrorMessage(error)
    } finally {
      loadingTitle = false
    }
  }

  function closePublish() {
    if (submitting) return
    if (mergeRequestUrl) selected.clear()
    publishing = false
  }

  async function publish(event: SubmitEvent) {
    event.preventDefault()
    if (refreshing || submitting || loadingTitle || !selected.size || !title.trim()) return
    submitting = true
    publishError = undefined
    try {
      const result = await publishModules({
        mainSha: changes.mainSha,
        previewSha: changes.previewSha,
        modules: [...selected],
        title: title.trim()
      })
      if ('mergeRequestUrl' in result) mergeRequestUrl = result.mergeRequestUrl
      else {
        const labels = rows.filter((row) => result.modules.includes(row.id)).map((row) => row.label)
        publishError = `Seit dem Vergleich in main oder preview geändert: ${labels.join(', ')}. Bitte neu vergleichen und die Auswahl erneut prüfen.`
      }
    } catch (error) {
      publishError = !isHttpError(error)
        ? getErrorMessage(error)
        : error.status === 409
          ? 'Es läuft bereits eine Veröffentlichung. Sie muss erst abgeschlossen oder in GitLab geschlossen und die Branch sbb gelöscht werden.'
          : error.status === 400
            ? 'Die Auswahl passt nicht mehr zum aktuellen Stand. Bitte neu vergleichen.'
            : getErrorMessage(error)
    } finally {
      submitting = false
    }
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape' && viewing && desktop.current && !publishing) closeDiff()
  }}
/>

<div class="flex min-h-0 flex-1">
  <div
    class={['mx-auto w-full max-w-6xl min-w-0 flex-1 space-y-8', viewing && 'lg:pr-6']}
    aria-busy={refreshing}
  >
    {@render header()}

    <section class="bg-muted/25 rounded-xl border" aria-label="Vergleich von preview und main">
      <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div class="flex items-start gap-3" role="status" aria-live="polite" aria-atomic="true">
          <div
            class="bg-background flex size-10 shrink-0 items-center justify-center rounded-lg border"
          >
            {#if rows.length}
              <GitCompareArrows class="size-5 text-sky-700 dark:text-sky-400" aria-hidden="true" />
            {:else}
              <CircleCheck
                class="size-5 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
            {/if}
          </div>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold tracking-tight">
              {rows.length
                ? `${rows.length} ${rows.length === 1 ? 'Modul unterscheidet' : 'Module unterscheiden'} sich von main`
                : 'Alle Module sind veröffentlicht'}
            </h2>
            <p class="text-muted-foreground text-sm">
              Stand main
              <code class="text-foreground font-mono" title={changes.mainSha}
                >{changes.mainSha.slice(0, 8)}</code
              >
              · preview
              <code class="text-foreground font-mono" title={changes.previewSha}
                >{changes.previewSha.slice(0, 8)}</code
              >
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onclick={refresh}
          aria-disabled={refreshing}
          class="shrink-0 aria-disabled:opacity-50"
        >
          <RefreshCw class={refreshing ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />
          {refreshing ? 'Wird verglichen …' : 'Neu vergleichen'}
        </Button>
      </div>
    </section>

    <ErrorMessage bind:message={refreshError} title="Aktualisierung fehlgeschlagen" />

    <Card.Root class="gap-0 overflow-hidden shadow-none">
      <Card.Header class="flex flex-wrap items-center gap-x-6 gap-y-3 pb-5">
        <h2 id="changed-modules" class="text-base font-semibold">Geänderte Module</h2>
        {#if rows.length}
          <div class="relative w-full sm:ml-auto sm:max-w-xs">
            <Search
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Modul suchen …"
              class="h-9 pl-9"
              bind:value={search}
              disabled={refreshing}
              oninput={() => (viewIndex = undefined)}
              aria-label="Geänderte Module durchsuchen"
            />
          </div>
        {/if}
      </Card.Header>
      {#if visibleRows.length}
        <Table.Root class="table-fixed" aria-labelledby="changed-modules">
          <Table.Header>
            <Table.Row class="bg-muted/40 hover:bg-muted/40">
              <Table.Head scope="col" class="w-12 pl-4 lg:pl-6">
                <Checkbox
                  disabled={refreshing}
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onCheckedChange={(checked) => {
                    for (const row of visibleRows) setSelected(row.id, checked)
                  }}
                  aria-label={allVisibleSelected
                    ? 'Alle angezeigten Module abwählen'
                    : 'Alle angezeigten Module auswählen'}
                />
              </Table.Head>
              <Table.Head scope="col">Modul</Table.Head>
              <Table.Head scope="col" class="hidden w-32 md:table-cell">Änderung</Table.Head>
              <Table.Head scope="col" class="hidden w-28 text-right md:table-cell"
                >Zeilen</Table.Head
              >
              <Table.Head scope="col" class="w-16 pr-4 lg:w-28 lg:pr-6">
                <span class="sr-only">Diff</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each visibleRows as row, index (row.id)}
              <Table.Row
                data-state={selected.has(row.id) ? 'selected' : undefined}
                class={viewing?.id === row.id ? 'bg-muted' : ''}
              >
                <Table.Cell class="py-4 pl-4 align-top lg:pl-6">
                  <Checkbox
                    class="mt-0.5"
                    disabled={refreshing}
                    checked={selected.has(row.id)}
                    onCheckedChange={(checked) => setSelected(row.id, checked)}
                    aria-label={`${row.label} auswählen`}
                  />
                </Table.Cell>
                <Table.Cell class="py-4 align-top whitespace-normal">
                  <p class={['font-medium wrap-anywhere', !row.title && 'font-mono text-sm']}>
                    {row.label}
                    {#if row.abbrev}
                      <span class="text-muted-foreground font-normal">· {row.abbrev}</span>
                    {/if}
                  </p>
                  <div class="mt-2 flex items-center gap-3 md:hidden">
                    {@render kindBadge(row)}
                    {@render lineStats(row)}
                  </div>
                </Table.Cell>
                <Table.Cell class="hidden py-4 align-top md:table-cell">
                  {@render kindBadge(row)}
                </Table.Cell>
                <Table.Cell class="hidden py-4 text-right align-top md:table-cell">
                  {@render lineStats(row)}
                </Table.Cell>
                <Table.Cell class="py-2.5 pr-4 text-right align-top lg:pr-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={(event) => {
                      diffTrigger = event.currentTarget
                      viewIndex = index
                    }}
                    aria-label={`Änderungen von ${row.label} anzeigen`}
                    aria-expanded={viewing?.id === row.id}
                    aria-controls="module-diff"
                  >
                    <FileDiff aria-hidden="true" />
                    <span class="hidden lg:inline">Diff</span>
                  </Button>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {:else}
        <Empty.Root class="border-t py-8 md:py-10">
          <Empty.Header>
            <CircleCheck class="text-muted-foreground mx-auto size-5" aria-hidden="true" />
            <Empty.Title class="text-sm">
              {rows.length ? 'Keine Treffer' : 'Keine Änderungen'}
            </Empty.Title>
            <Empty.Description>
              {rows.length
                ? 'Kein Modul passt zur Suche.'
                : 'Alle Module aus preview sind bereits in main.'}
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      {/if}
    </Card.Root>

    {#if rows.length}
      <div
        class="bg-background/95 supports-backdrop-filter:bg-background/80 sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border p-3 pl-5 shadow-lg backdrop-blur"
      >
        <p class="text-sm" aria-live="polite">
          <span class="font-semibold tabular-nums">{selected.size}</span>
          <span class="text-muted-foreground"
            >{selected.size === 1 ? 'Modul' : 'Module'} ausgewählt</span
          >
        </p>
        {#if selected.size}
          <Button variant="ghost" size="sm" disabled={refreshing} onclick={() => selected.clear()}
            >Auswahl aufheben</Button
          >
        {/if}
        <Button
          class="ml-auto"
          disabled={refreshing || loadingTitle || !selected.size}
          onclick={openPublish}
        >
          {#if loadingTitle}
            <Spinner size="sm" />
          {:else}
            <GitPullRequestArrow aria-hidden="true" />
          {/if}
          Veröffentlichen …
        </Button>
      </div>
    {/if}
  </div>

  {#if viewing && viewIndex !== undefined && desktop.current}
    <aside
      id="module-diff"
      aria-labelledby="module-diff-title"
      class="bg-background sticky top-6 flex h-[calc(100vh-7rem)] w-[min(42vw,48rem)] shrink-0 flex-col border-l"
    >
      <div class="flex items-start justify-between gap-4 border-b px-6 py-4">
        <div class="min-w-0 space-y-2">
          <h2
            id="module-diff-title"
            tabindex="-1"
            class="text-lg font-semibold tracking-tight wrap-anywhere outline-none"
            {@attach (node) => node.focus()}
          >
            {@render diffTitle(viewing)}
          </h2>
          {@render diffMeta(viewing)}
        </div>
        <Button variant="ghost" size="icon" class="size-9" onclick={closeDiff}>
          <X aria-hidden="true" />
          <span class="sr-only">Änderungen schließen</span>
        </Button>
      </div>
      {@render diffBody(viewing, viewIndex)}
    </aside>
  {/if}
</div>

{#if !desktop.current}
  <Sheet.Root
    open={viewing !== undefined}
    onOpenChange={(open) => {
      if (!open) viewIndex = undefined
    }}
  >
    <Sheet.Content
      id="module-diff"
      side="right"
      class="flex w-full flex-col gap-0 p-0 sm:max-w-none"
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        diffTrigger?.focus()
      }}
    >
      {#if viewing && viewIndex !== undefined}
        <Sheet.Header class="space-y-2 border-b px-6 py-4 pr-12 text-left">
          <Sheet.Title class="text-lg font-semibold tracking-tight wrap-anywhere">
            {@render diffTitle(viewing)}
          </Sheet.Title>
          <Sheet.Description class="sr-only">
            Änderungen prüfen und zur Veröffentlichung auswählen.
          </Sheet.Description>
          {@render diffMeta(viewing)}
        </Sheet.Header>
        {@render diffBody(viewing, viewIndex)}
      {/if}
    </Sheet.Content>
  </Sheet.Root>
{/if}

<Dialog.Root
  open={publishing}
  onOpenChange={(open) => {
    if (!open) closePublish()
  }}
>
  <Dialog.Content showClose={!submitting} class="sm:max-w-lg">
    {#if mergeRequestUrl}
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2">
          <CircleCheck class="size-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          Veröffentlichung gestartet
        </Dialog.Title>
        <Dialog.Description>
          Die Module werden jetzt geprüft und anschließend automatisch nach
          <code class="font-mono">main</code> übernommen. Schlägt die Prüfung fehl, wird der Merge Request
          mit den Fehlern kommentiert und geschlossen.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer class="gap-2">
        <Button variant="outline" onclick={closePublish}>Schließen</Button>
        <Button href={mergeRequestUrl} target="_blank" rel="noopener noreferrer">
          In GitLab öffnen <ExternalLink aria-hidden="true" />
        </Button>
      </Dialog.Footer>
    {:else}
      <form class="grid gap-4" onsubmit={publish}>
        <Dialog.Header>
          <Dialog.Title>
            {selectedRows.length}
            {selectedRows.length === 1 ? 'Modul' : 'Module'} veröffentlichen
          </Dialog.Title>
          <Dialog.Description>
            Übernommen wird der geprüfte Stand
            <code class="font-mono">{changes.previewSha.slice(0, 8)}</code> aus
            <code class="font-mono">preview</code>. Vor der Übernahme nach
            <code class="font-mono">main</code> werden die Module automatisch geprüft.
          </Dialog.Description>
        </Dialog.Header>
        {#if selectedRows.some((row) => row.change === 'deleted')}
          <p
            class="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300"
          >
            <TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Gelöschte Module werden beim Import nicht aus der Datenbank entfernt.
          </p>
        {/if}
        <div class="grid gap-2">
          <Label for="publication-title">Titel des Merge Requests in GitLab</Label>
          <Input
            id="publication-title"
            bind:value={title}
            required
            maxlength={255}
            disabled={loadingTitle || submitting}
            placeholder={loadingTitle ? 'Titel wird ermittelt …' : 'Titel eingeben'}
            aria-describedby={loadingTitle || titleError ? 'publication-title-status' : undefined}
          />
          {#if loadingTitle}
            <p
              id="publication-title-status"
              class="text-muted-foreground flex items-center gap-2 text-sm"
              role="status"
            >
              <Spinner size="sm" />
              Titel wird ermittelt …
            </p>
          {:else if titleError}
            <div id="publication-title-status" class="space-y-2">
              <p class="text-destructive text-sm" role="alert">
                {titleError}. Bitte erneut laden oder den Titel selbst eingeben.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onclick={loadTitle}
              >
                <RefreshCw aria-hidden="true" />
                Titel erneut laden
              </Button>
            </div>
          {/if}
        </div>
        <ErrorMessage bind:message={publishError} title="Veröffentlichung fehlgeschlagen" />
        <Dialog.Footer class="gap-2">
          <Button type="button" variant="outline" disabled={submitting} onclick={closePublish}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={submitting || loadingTitle || !title.trim()}>
            {#if submitting}
              <Spinner size="sm" />
            {:else}
              <GitPullRequestArrow aria-hidden="true" />
            {/if}
            Veröffentlichen
          </Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>

{#snippet kindBadge(row: Row)}
  {@const { label, class: className } = kinds[row.change]}
  <Badge variant="outline" class={className}>{label}</Badge>
{/snippet}

{#snippet lineStats(row: Row)}
  <span class="font-mono text-xs tabular-nums">
    <span class="text-emerald-700 dark:text-emerald-400">+{row.additions}</span>
    <span class="text-red-700 dark:text-red-400">−{row.deletions}</span>
  </span>
{/snippet}

{#snippet diffTitle(row: Row)}
  {row.label}
  {#if row.abbrev}
    <span class="text-muted-foreground font-normal">· {row.abbrev}</span>
  {/if}
{/snippet}

{#snippet diffMeta(row: Row)}
  <div class="flex flex-wrap items-center gap-3">
    {@render kindBadge(row)}
    {@render lineStats(row)}
    {#if row.change !== 'deleted'}
      <Button variant="outline" size="sm" href={resolve(MY_MODULE_ROUTE_ID, { id: row.id })}>
        <SquarePen aria-hidden="true" />
        Modul bearbeiten
      </Button>
    {/if}
  </div>
{/snippet}

{#snippet diffBody(row: Row, index: number)}
  <div class="min-h-0 flex-1 overflow-y-auto p-6">
    <div class="overflow-hidden rounded-md border">
      {#if row.file.diff}
        <PatchDiffView file={row.file} />
      {:else}
        <p class="text-muted-foreground p-4 text-sm">
          GitLab liefert keinen Textdiff, z. B. weil die Datei zu groß ist.
        </p>
      {/if}
    </div>
  </div>
  <div class="flex flex-wrap items-center gap-3 border-t px-6 py-3">
    <div class="flex items-center gap-2">
      <Checkbox
        id="module-diff-selected"
        disabled={refreshing}
        checked={selected.has(row.id)}
        onCheckedChange={(checked) => setSelected(row.id, checked)}
      />
      <Label for="module-diff-selected">Zur Veröffentlichung auswählen</Label>
    </div>
    <div class="ml-auto flex items-center gap-1">
      <span class="text-muted-foreground mr-2 text-sm tabular-nums">
        {index + 1} / {visibleRows.length}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={index === 0}
        onclick={() => (viewIndex = index - 1)}
        aria-label="Vorheriges Modul"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={index === visibleRows.length - 1}
        onclick={() => (viewIndex = index + 1)}
        aria-label="Nächstes Modul"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  </div>
{/snippet}
