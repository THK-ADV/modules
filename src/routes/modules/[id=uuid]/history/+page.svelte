<script lang="ts">
  import type { PageProps } from './$types'
  import {
    TimelineSection,
    VersionMetadata,
    FileDiffView,
    FileView,
    EventInfoCard,
    downloadModuleVersion
  } from '$lib/components/history'
  import { isParsed, type ModuleVersion } from '$lib/types/module-version'
  import * as Card from '$lib/components/ui/card'
  import * as Empty from '$lib/components/ui/empty'
  import * as Tabs from '$lib/components/ui/tabs'
  import { Button } from '$lib/components/ui/button'
  import {
    ArrowLeftRight,
    Check,
    Download,
    FileText,
    GitCommitVertical,
    GitCompare,
    History,
    RotateCcw,
    X
  } from '@lucide/svelte'
  import { cn } from '$lib/utils'

  type ContentView = 'diff' | 'rendered'
  type Side = 'left' | 'right'

  let { data }: PageProps = $props()
  const { history, module } = $derived(data)

  const parsedVersions = $derived(history.filter(isParsed))
  const latestParsedVersion = $derived(parsedVersions[parsedVersions.length - 1])
  const canDiff = $derived(parsedVersions.length >= 2)
  const newestEventIsNonParsed = $derived(
    history.length > 0 && !isParsed(history[history.length - 1])
  )

  let filePreviewCommitId: string | null = $state(null)
  let selectedLeftCommitId: string | null = $state(null)
  let customRightCommitId: string | null = $state(null)
  let focusedEventCommitId: string | null = $state(null)
  let contentView: ContentView = $state('rendered')
  let dropTargetSide: Side | null = $state(null)
  let conflictMessage: string | null = $state(null)

  // Not reactive: only read inside DnD event handlers, never in template/$derived.
  let draggedCommitId: string | null = null

  const selectedRightCommitId = $derived(
    customRightCommitId ?? latestParsedVersion?.commitId ?? null
  )

  // Right slot is "custom" only if it's been overridden away from the default.
  const rightIsCustom = $derived(
    customRightCommitId !== null && customRightCommitId !== latestParsedVersion?.commitId
  )

  const fileHighlightCommitId = $derived(
    filePreviewCommitId ?? latestParsedVersion?.commitId ?? null
  )

  const leftVersion = $derived(
    selectedLeftCommitId ? (history.find((v) => v.commitId === selectedLeftCommitId) ?? null) : null
  )
  const rightVersion = $derived(
    selectedRightCommitId
      ? (history.find((v) => v.commitId === selectedRightCommitId) ?? null)
      : null
  )
  const focusedEvent = $derived(
    focusedEventCommitId ? (history.find((v) => v.commitId === focusedEventCommitId) ?? null) : null
  )
  const focusedEventIsNonParsed = $derived(focusedEvent !== null && !isParsed(focusedEvent))

  const isComparable = $derived(
    leftVersion !== null &&
      rightVersion !== null &&
      leftVersion.commitId !== rightVersion.commitId &&
      isParsed(leftVersion) &&
      isParsed(rightVersion)
  )

  const comparison = $derived.by(() => {
    if (!isComparable || !leftVersion || !rightVersion) return null
    if (!isParsed(leftVersion) || !isParsed(rightVersion)) return null
    return {
      oldFileVersion: {
        id: leftVersion.content.module.id,
        content: leftVersion.content.fileContent
      },
      newFileVersion: {
        id: rightVersion.content.module.id,
        content: rightVersion.content.fileContent
      }
    }
  })

  const currentFileVersion = $derived.by(() => {
    const id = filePreviewCommitId ?? latestParsedVersion?.commitId ?? null
    if (!id) return null
    const v = history.find((entry) => entry.commitId === id)
    return v && isParsed(v) ? v : null
  })

  function flashConflict(message: string) {
    conflictMessage = message
    setTimeout(() => {
      if (conflictMessage === message) conflictMessage = null
    }, 3500)
  }

  function handleNodeClickForFile(version: ModuleVersion) {
    if (!isParsed(version)) {
      focusedEventCommitId = version.commitId
      filePreviewCommitId = null
      return
    }
    focusedEventCommitId = null
    filePreviewCommitId = version.commitId
  }

  function handleShowFileFromTimeline(version: ModuleVersion) {
    if (!isParsed(version)) {
      focusedEventCommitId = version.commitId
      return
    }
    focusedEventCommitId = null
    filePreviewCommitId = version.commitId
    contentView = 'rendered'
  }

  function assignDiffSide(version: ModuleVersion, side: Side) {
    if (!isParsed(version)) {
      focusedEventCommitId = version.commitId
      return
    }
    focusedEventCommitId = null
    conflictMessage = null

    if (side === 'left') {
      // If user picks a version that's currently on the right, move the right
      // back to its default to avoid an identical comparison.
      if (customRightCommitId === version.commitId) {
        customRightCommitId = null
      }
      // If selecting the latest version (which is the default for "right"),
      // move the right slot to the previous parsed version so the diff is meaningful.
      if (
        version.commitId === latestParsedVersion?.commitId &&
        customRightCommitId === null &&
        parsedVersions.length >= 2
      ) {
        const previous = parsedVersions[parsedVersions.length - 2]
        customRightCommitId = previous.commitId
        flashConflict(
          'Vorher und Nachher waren identisch — Nachher wurde auf die Vorgängerversion gesetzt.'
        )
      }
      selectedLeftCommitId = version.commitId
      return
    }

    // right side
    if (selectedLeftCommitId === version.commitId) {
      selectedLeftCommitId = null
      flashConflict('Vorher und Nachher waren identisch — Vorher wurde geleert.')
    }
    if (version.commitId === latestParsedVersion?.commitId) {
      customRightCommitId = null
    } else {
      customRightCommitId = version.commitId
    }
  }

  function handleNodeDragStart(version: ModuleVersion, event: DragEvent) {
    if (contentView !== 'diff' || !isParsed(version)) return
    draggedCommitId = version.commitId
    event.dataTransfer?.setData('text/plain', version.commitId)
    event.dataTransfer?.setData('application/x-module-version', version.commitId)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleNodeDragEnd() {
    draggedCommitId = null
    dropTargetSide = null
  }

  function handleDropTargetDragOver(side: Side, event: DragEvent) {
    if (!draggedCommitId) return
    event.preventDefault()
    dropTargetSide = side
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  function handleDropTargetDragLeave(side: Side) {
    if (dropTargetSide === side) {
      dropTargetSide = null
    }
  }

  function handleDropTargetDrop(side: Side, event: DragEvent) {
    event.preventDefault()
    const commitId =
      event.dataTransfer?.getData('application/x-module-version') ||
      event.dataTransfer?.getData('text/plain') ||
      draggedCommitId
    dropTargetSide = null
    draggedCommitId = null

    if (!commitId) return
    const version = history.find((entry) => entry.commitId === commitId)
    if (!version) return
    assignDiffSide(version, side)
  }

  function clearDiffLeft() {
    selectedLeftCommitId = null
  }

  function swapDiffSides() {
    const previousLeft = selectedLeftCommitId
    const previousRight = selectedRightCommitId
    if (!previousLeft || !previousRight) return
    selectedLeftCommitId = previousRight
    customRightCommitId = previousLeft === latestParsedVersion?.commitId ? null : previousLeft
  }

  function resetDiff() {
    selectedLeftCommitId = null
    customRightCommitId = null
    conflictMessage = null
  }

  function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function setContentView(next: string | undefined) {
    if (next !== 'diff' && next !== 'rendered') return
    if (next === 'diff' && !canDiff) return
    if (contentView !== next) {
      focusedEventCommitId = null
    }
    contentView = next
  }
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <header class="space-y-2">
    <h1 class="text-foreground text-3xl font-bold tracking-tight">{module.title}</h1>
    <p class="text-muted-foreground text-sm tabular-nums">
      {parsedVersions.length}
      {parsedVersions.length === 1 ? 'Version' : 'Versionen'} ·
      {history.length}
      {history.length === 1 ? 'Ereignis' : 'Ereignisse'} insgesamt
    </p>
  </header>

  {#if history.length === 0}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <GitCommitVertical />
        </Empty.Media>
        <Empty.Title>Keine Historie vorhanden</Empty.Title>
        <Empty.Description>Für dieses Modul liegt keine Historie vor.</Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else}
    <TimelineSection
      {history}
      selectedLeftCommitId={leftVersion?.commitId ?? null}
      selectedRightCommitId={rightVersion?.commitId ?? null}
      filePreviewCommitId={fileHighlightCommitId}
      {focusedEventCommitId}
      interactionMode={contentView === 'rendered' ? 'file' : 'diff'}
      onNodeClick={handleNodeClickForFile}
      onAssignSide={assignDiffSide}
      onShowFile={handleShowFileFromTimeline}
      onNodeDragStart={handleNodeDragStart}
      onNodeDragEnd={handleNodeDragEnd}
    />

    {#if newestEventIsNonParsed && rightVersion?.commitId === latestParsedVersion?.commitId && !focusedEventIsNonParsed}
      <div
        class="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
      >
        Das neueste Ereignis ist {history[history.length - 1].content.type === 'deleted'
          ? 'eine Löschung'
          : 'ein Parsing-Fehler'} – als Vergleichsbasis wird die letzte gültige Version verwendet.
      </div>
    {/if}

    <section class="flex max-w-full min-w-0 flex-col gap-4">
      {#if focusedEvent && !isParsed(focusedEvent)}
        <EventInfoCard event={focusedEvent} />
      {:else}
        <Card.Root class="max-w-full min-w-0 overflow-hidden p-0">
          <Tabs.Root value={contentView} onValueChange={setContentView}>
            <div
              class="border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2 border-b px-2 py-2"
            >
              <Tabs.List class="bg-transparent">
                <Tabs.Trigger value="rendered">
                  <FileText class="mr-1.5 size-4" />
                  Datei
                </Tabs.Trigger>
                {#if canDiff}
                  <Tabs.Trigger value="diff">
                    <GitCompare class="mr-1.5 size-4" />
                    Vergleich
                  </Tabs.Trigger>
                {/if}
              </Tabs.List>
              <div class="flex flex-wrap items-center gap-2">
                {#if contentView === 'rendered'}
                  {#if currentFileVersion}
                    {@const isLatest =
                      currentFileVersion.commitId === latestParsedVersion?.commitId}
                    <span
                      class={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-full border py-1 pr-3 pl-1.5 text-xs font-medium tabular-nums',
                        isLatest
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400'
                          : 'border-border bg-muted/40 text-muted-foreground'
                      )}
                      aria-live="polite"
                    >
                      {#if isLatest}
                        <Check class="size-4" aria-hidden="true" />
                        <span class="hidden sm:inline">Aktuelle Version</span>
                        <span class="sm:hidden">Aktuell</span>
                      {:else}
                        <History class="size-4" aria-hidden="true" />
                        <span class="hidden sm:inline">Version vom</span>
                        <span>{formatShortDate(currentFileVersion.committedAt)}</span>
                      {/if}
                    </span>
                  {/if}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8"
                    onclick={() => currentFileVersion && downloadModuleVersion(currentFileVersion)}
                    disabled={!currentFileVersion}
                    aria-label="Aktuell angezeigte Version herunterladen"
                  >
                    <Download class="size-4" />
                    <span class="hidden sm:inline">Herunterladen</span>
                  </Button>
                {:else if contentView === 'diff'}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8"
                    onclick={swapDiffSides}
                    disabled={!leftVersion || !rightVersion}
                    aria-label="Vorher und Nachher tauschen"
                  >
                    <ArrowLeftRight class="size-4" />
                    <span class="hidden sm:inline">Tauschen</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8"
                    onclick={resetDiff}
                    disabled={!selectedLeftCommitId && !rightIsCustom}
                  >
                    <RotateCcw class="size-4" />
                    <span class="hidden sm:inline">Zurücksetzen</span>
                  </Button>
                {/if}
              </div>
            </div>

            <Tabs.Content value="rendered" class="m-0 min-h-60 max-w-full min-w-0">
              {#if currentFileVersion}
                <FileView
                  fileVersion={{
                    id: currentFileVersion.content.module.id,
                    content: currentFileVersion.content.fileContent
                  }}
                />
              {:else}
                <Empty.Root>
                  <Empty.Header>
                    <Empty.Media variant="default" />
                    <Empty.Title>Datei nicht verfügbar</Empty.Title>
                    <Empty.Description>Für diese Version liegt kein Inhalt vor.</Empty.Description>
                  </Empty.Header>
                </Empty.Root>
              {/if}
            </Tabs.Content>

            <Tabs.Content value="diff" class="m-0 min-h-60 max-w-full min-w-0">
              <div class="border-border grid gap-3 border-b p-3 sm:grid-cols-2">
                <div
                  role="region"
                  aria-label="Vorher – Version hierher ziehen oder im Zeitstrahl antippen"
                  class={cn(
                    'bg-muted/20 relative flex min-h-20 flex-col gap-2 overflow-hidden rounded-lg border-l-3 border-rose-500/50 px-3 py-3 transition-colors sm:min-h-24',
                    dropTargetSide === 'left' &&
                      'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30'
                  )}
                  ondragover={(e) => handleDropTargetDragOver('left', e)}
                  ondragleave={() => handleDropTargetDragLeave('left')}
                  ondrop={(e) => handleDropTargetDrop('left', e)}
                >
                  <div class="flex items-center justify-between gap-2">
                    <span
                      class="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.12em] text-rose-600 uppercase dark:text-rose-400"
                    >
                      <span class="size-1.5 rounded-full bg-rose-500"></span>
                      Vorher
                    </span>
                    {#if leftVersion}
                      <div class="-mr-2 flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          class="text-muted-foreground h-7 px-2 text-xs"
                          onclick={() => downloadModuleVersion(leftVersion)}
                          aria-label="Vorher-Version herunterladen"
                        >
                          <Download class="size-4" />
                          <span class="hidden sm:inline">Herunterladen</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="text-muted-foreground h-7 px-2 text-xs"
                          onclick={clearDiffLeft}
                        >
                          <X class="size-4" />
                          <span class="hidden sm:inline">Leeren</span>
                        </Button>
                      </div>
                    {/if}
                  </div>
                  {#if leftVersion}
                    <VersionMetadata version={leftVersion} />
                  {:else}
                    <p class="text-muted-foreground m-0 text-sm">
                      Auf dem Zeitstrahl einen grünen Punkt antippen.
                    </p>
                  {/if}
                </div>
                <div
                  role="region"
                  aria-label="Nachher – Version hierher ziehen oder im Zeitstrahl antippen"
                  class={cn(
                    'bg-muted/20 relative flex min-h-20 flex-col gap-2 overflow-hidden rounded-lg border-l-3 border-emerald-500/50 px-3 py-3 transition-colors sm:min-h-24',
                    dropTargetSide === 'right' &&
                      'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                  )}
                  ondragover={(e) => handleDropTargetDragOver('right', e)}
                  ondragleave={() => handleDropTargetDragLeave('right')}
                  ondrop={(e) => handleDropTargetDrop('right', e)}
                >
                  <div class="flex items-center justify-between gap-2">
                    <span
                      class="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.12em] text-emerald-600 uppercase dark:text-emerald-400"
                    >
                      <span class="size-1.5 rounded-full bg-emerald-500"></span>
                      Nachher
                      {#if !rightIsCustom}
                        <span class="text-muted-foreground/80 ml-1 tracking-normal normal-case">
                          (aktuell)
                        </span>
                      {/if}
                    </span>
                    {#if rightVersion}
                      <Button
                        variant="ghost"
                        size="sm"
                        class="text-muted-foreground -mr-2 h-7 px-2 text-xs"
                        onclick={() => downloadModuleVersion(rightVersion)}
                        aria-label="Nachher-Version herunterladen"
                      >
                        <Download class="size-4" />
                        <span class="hidden sm:inline">Herunterladen</span>
                      </Button>
                    {/if}
                  </div>
                  {#if rightVersion}
                    <VersionMetadata version={rightVersion} />
                  {:else}
                    <p class="text-muted-foreground m-0 text-sm">Keine rechte Version.</p>
                  {/if}
                </div>
              </div>

              {#if conflictMessage}
                <div
                  class="border-border/60 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300"
                  role="status"
                >
                  {conflictMessage}
                </div>
              {/if}

              {#if comparison && leftVersion && rightVersion && isParsed(leftVersion) && isParsed(rightVersion)}
                <FileDiffView {comparison} />
              {:else}
                <Empty.Root>
                  <Empty.Header>
                    <Empty.Media variant="icon">
                      <GitCompare />
                    </Empty.Media>
                    <Empty.Title>Zwei Versionen vergleichen</Empty.Title>
                    <Empty.Description
                      >Tippe auf einen grünen Punkt im Zeitstrahl und wähle <span
                        class="text-rose-500 dark:text-rose-400">Vorher</span
                      >
                      oder
                      <span class="text-emerald-500 dark:text-emerald-400">Nachher</span
                      >.</Empty.Description
                    >
                  </Empty.Header>
                </Empty.Root>
              {/if}
            </Tabs.Content>
          </Tabs.Root>
        </Card.Root>
      {/if}
    </section>
  {/if}
</div>
