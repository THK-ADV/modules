<script lang="ts">
  import { isParsed, type ModuleVersion } from '$lib/types/module-version'
  import type { Semester } from '$lib/types/semester'
  import * as Tooltip from '$lib/components/ui/tooltip'
  import * as Popover from '$lib/components/ui/popover'
  import { Button } from '$lib/components/ui/button'
  import { ArrowLeftToLine, ArrowRightToLine, FileText } from '@lucide/svelte'
  import { cn } from '$lib/utils'
  import { IsMobile } from '$lib/hooks/is-mobile.svelte'

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

  const isMobile = new IsMobile()

  const NODE_SIZE = 16
  const LANE_HEIGHT = 28
  const COLLISION_THRESHOLD = 0.085
  const HEADER_HEIGHT = 56

  let popoverOpenId: string | null = $state(null)

  function semesterStartUtc(s: Semester): number {
    return Date.parse(`${s.start}T00:00:00Z`)
  }

  function semesterEndUtc(s: Semester): number {
    return Date.parse(`${s.end}T23:59:59.999Z`)
  }

  function formatSemesterLabel(semester: Semester) {
    return `${semester.deLabel} ${semester.year}`
  }

  function formatSemesterLabelShort(semester: Semester) {
    return semester.abbrev
  }

  function formatLongDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  function formatMonthRange(s: Semester) {
    const start = new Date(`${s.start}T00:00:00Z`)
    const end = new Date(`${s.end}T00:00:00Z`)
    const fmt = (d: Date) =>
      d.toLocaleDateString('de-DE', { month: 'short', timeZone: 'UTC' }).replace('.', '')
    const yearSuffix = (d: Date) => `'${String(d.getUTCFullYear()).slice(-2)}`
    if (start.getUTCFullYear() === end.getUTCFullYear()) {
      return `${fmt(start)} – ${fmt(end)} ${yearSuffix(end)}`
    }
    return `${fmt(start)} ${yearSuffix(start)} – ${fmt(end)} ${yearSuffix(end)}`
  }

  type AxisSemester = Semester & {
    startMs: number
    endMs: number
    startPct: number
    widthPct: number
    segmentIndex: number
    monthRange: string
  }

  const semesters: AxisSemester[] = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const map = new Map<string, Semester>()
    for (const v of history) {
      map.set(v.semester.id, v.semester)
    }
    const sorted = Array.from(map.values()).sort(
      (a, b) => semesterStartUtc(a) - semesterStartUtc(b)
    )
    const widthPct = sorted.length > 0 ? 100 / sorted.length : 100
    return sorted.map((s, idx) => ({
      ...s,
      startMs: semesterStartUtc(s),
      endMs: semesterEndUtc(s),
      startPct: idx * widthPct,
      widthPct,
      segmentIndex: idx,
      monthRange: formatMonthRange(s)
    }))
  })

  type EventVisual = {
    id: string
    version: ModuleVersion
    xPct: number
    lane: number
    type: 'parsed' | 'deleted' | 'parseError'
    selectable: boolean
    /** Generic type label for non-parsed events; parsed events use formatted date instead */
    typeLabel: string
    primaryLabel: string
    secondaryLabel: string
  }

  function eventTypeOf(v: ModuleVersion): EventVisual['type'] {
    if (v.content.type === 'parsed') return 'parsed'
    if (v.content.type === 'deleted') return 'deleted'
    return 'parseError'
  }

  function typeLabelOf(v: ModuleVersion): string {
    if (v.content.type === 'parsed') return 'Version'
    if (v.content.type === 'deleted') return 'Gelöscht'
    return 'Parsing-Fehler'
  }

  const events: EventVisual[] = $derived.by(() => {
    const result: EventVisual[] = []
    const placed: { unitPosition: number; lane: number }[] = []
    const semesterCount = Math.max(semesters.length, 1)

    for (const v of history) {
      const sem = semesters.find((s) => s.id === v.semester.id)
      if (!sem) continue

      const ts = Date.parse(v.committedAt)
      let ratio = (ts - sem.startMs) / (sem.endMs - sem.startMs)
      if (!Number.isFinite(ratio)) ratio = 0
      ratio = Math.max(0, Math.min(1, ratio))

      const unitPosition = sem.segmentIndex + ratio
      const xPct = (unitPosition / semesterCount) * 100

      let lane = 0
      while (
        placed.some(
          (p) => p.lane === lane && Math.abs(p.unitPosition - unitPosition) < COLLISION_THRESHOLD
        )
      ) {
        lane++
      }
      placed.push({ unitPosition, lane })

      const type = eventTypeOf(v)
      const typeLabel = typeLabelOf(v)
      const isParsedEvent = v.content.type === 'parsed'

      result.push({
        id: v.commitId,
        version: v,
        xPct,
        lane,
        type,
        selectable: isParsed(v),
        typeLabel,
        primaryLabel: isParsedEvent ? formatLongDate(v.committedAt) : typeLabel,
        secondaryLabel: isParsedEvent
          ? `${formatSemesterLabel(v.semester)}`
          : `${formatLongDate(v.committedAt)}`
      })
    }
    return result
  })

  const maxLane = $derived(events.reduce((m, e) => Math.max(m, e.lane), 0))
  const totalHeight = $derived(HEADER_HEIGHT + 64 + maxLane * LANE_HEIGHT + 12)
  const baselineY = $derived(HEADER_HEIGHT + 36 + maxLane * LANE_HEIGHT)

  const nowMs = Date.now()

  const todayPct = $derived.by(() => {
    if (semesters.length === 0) return null
    const first = semesters[0]
    const last = semesters[semesters.length - 1]
    if (nowMs < first.startMs || nowMs > last.endMs) return null
    const sem = semesters.find((s) => nowMs >= s.startMs && nowMs <= s.endMs)
    if (!sem) return null
    const ratio = (nowMs - sem.startMs) / (sem.endMs - sem.startMs)
    const unitPosition = sem.segmentIndex + Math.max(0, Math.min(1, ratio))
    return (unitPosition / Math.max(semesters.length, 1)) * 100
  })

  function formatShortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function dotColorClass(type: EventVisual['type']) {
    if (type === 'parsed') return 'bg-emerald-500'
    if (type === 'deleted') return 'bg-zinc-500'
    return 'bg-amber-500'
  }

  function ringColorClass(e: EventVisual): string | null {
    if (interactionMode === 'file') {
      if (e.id === filePreviewCommitId) return 'border-primary'
      return null
    }
    if (e.id === selectedLeftCommitId) return 'border-rose-500'
    if (e.id === selectedRightCommitId) return 'border-emerald-500'
    return null
  }

  function ariaLabel(e: EventVisual) {
    const date = formatShortDate(e.version.committedAt)
    const semLabel = formatSemesterLabel(e.version.semester)
    return `${e.typeLabel}, ${date}, ${semLabel}`
  }

  function onPlainClick(e: EventVisual) {
    onNodeClick(e.version)
  }

  function handlePopoverOpenChange(id: string, open: boolean) {
    if (open) {
      popoverOpenId = id
    } else if (popoverOpenId === id) {
      popoverOpenId = null
    }
  }

  function assignAndClose(version: ModuleVersion, side: Side) {
    onAssignSide(version, side)
    popoverOpenId = null
  }

  function showFileAndClose(version: ModuleVersion) {
    onShowFile(version)
    popoverOpenId = null
  }
</script>

<div class="max-w-full min-w-0 overflow-x-clip pb-2">
  <div class="relative w-full min-w-0" style:height="{totalHeight}px" style:min-height="148px">
    <!-- Semester column headers -->
    <div class="relative w-full min-w-0" style:height="{HEADER_HEIGHT}px">
      {#each semesters as sem (sem.id)}
        <div
          class="pointer-events-none absolute top-0 flex h-full max-w-full min-w-0 flex-col items-center justify-start gap-0.5 px-1 pt-2 sm:px-2"
          style:left="{sem.startPct}%"
          style:width="{sem.widthPct}%"
        >
          <span
            class="text-muted-foreground line-clamp-1 text-center text-xs leading-tight font-medium tracking-wide uppercase sm:tracking-[0.12em]"
          >
            {isMobile.current ? formatSemesterLabelShort(sem) : formatSemesterLabel(sem)}
          </span>
          <span
            class="text-muted-foreground/70 line-clamp-1 text-center text-[11px] leading-tight tabular-nums"
          >
            {sem.monthRange}
          </span>
        </div>
      {/each}
    </div>

    <svg class="text-border pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {#each semesters as sem, idx (sem.id)}
        {#if idx % 2 === 1}
          <rect
            x={`${sem.startPct}%`}
            y={HEADER_HEIGHT - 8}
            width={`${sem.widthPct}%`}
            height={totalHeight - HEADER_HEIGHT}
            class="text-muted-foreground"
            fill="currentColor"
            opacity="0.07"
          />
        {/if}
      {/each}
      <line
        x1="0%"
        x2="100%"
        y1={baselineY}
        y2={baselineY}
        stroke="currentColor"
        stroke-width="1"
      />
      {#if todayPct !== null}
        <line
          x1={`${todayPct}%`}
          x2={`${todayPct}%`}
          y1={HEADER_HEIGHT - 4}
          y2={totalHeight - 6}
          class="text-primary"
          stroke="currentColor"
          stroke-width="1.25"
          stroke-dasharray="2 3"
          opacity="0.85"
        />
      {/if}
    </svg>

    {#if todayPct !== null}
      <div
        class="text-primary pointer-events-none absolute -translate-x-1/2 text-[10px] font-semibold tracking-wide uppercase"
        style:left="{todayPct}%"
        style:top="{HEADER_HEIGHT - 14}px"
      >
        Heute
      </div>
    {/if}

    <Tooltip.Provider delayDuration={250} disableHoverableContent>
      {#each events as e (e.id)}
        {@const top = baselineY - e.lane * LANE_HEIGHT - NODE_SIZE / 2}
        {@const isSelected =
          interactionMode === 'file'
            ? e.id === filePreviewCommitId
            : e.id === selectedLeftCommitId || e.id === selectedRightCommitId}
        {@const isFocused = e.id === focusedEventCommitId}
        {@const ring = ringColorClass(e)}
        {@const draggable = interactionMode === 'diff' && e.selectable}
        {@const showAssignmentPopover = interactionMode === 'diff' && e.selectable}

        {#if showAssignmentPopover}
          <Popover.Root
            open={popoverOpenId === e.id}
            onOpenChange={(open) => handlePopoverOpenChange(e.id, open)}
          >
            <Popover.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  type="button"
                  draggable={draggable ? true : undefined}
                  class={cn(
                    'absolute inline-flex size-4 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full p-0 transition-transform duration-150 hover:scale-110 focus-visible:outline-none active:scale-95',
                    draggable && 'sm:cursor-grab sm:active:cursor-grabbing'
                  )}
                  style:left="{e.xPct}%"
                  style:top="{top}px"
                  aria-label={ariaLabel(e)}
                  aria-pressed={isSelected ? true : undefined}
                  ondragstart={(event) => onNodeDragStart(e.version, event)}
                  ondragend={onNodeDragEnd}
                >
                  {#if isSelected && ring}
                    <span
                      class={cn(
                        'pointer-events-none absolute -inset-2 rounded-full border-2',
                        ring
                      )}
                      aria-hidden="true"
                    ></span>
                  {/if}
                  <span
                    class={cn(
                      'ring-card relative size-3 rounded-full ring-2 transition-transform duration-150',
                      dotColorClass(e.type),
                      isFocused &&
                        !isSelected &&
                        'ring-offset-card scale-110 ring-current ring-offset-2'
                    )}
                    aria-hidden="true"
                  ></span>
                </button>
              {/snippet}
            </Popover.Trigger>
            <Popover.Content class="w-60 p-2" align="center" sideOffset={10}>
              <div class="border-border mb-1 border-b px-2 pt-1 pb-2">
                <p class="text-foreground m-0 truncate text-sm font-semibold">{e.primaryLabel}</p>
                <p class="text-muted-foreground m-0 truncate text-xs tabular-nums">
                  {e.secondaryLabel}
                </p>
              </div>
              <div class="flex flex-col">
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-9 w-full justify-start gap-1.5"
                  onclick={() => assignAndClose(e.version, 'left')}
                >
                  <ArrowLeftToLine class="size-4 text-rose-500" />
                  <span>Als <span class="font-medium">Vorher</span> setzen</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-9 w-full justify-start gap-1.5"
                  onclick={() => assignAndClose(e.version, 'right')}
                >
                  <ArrowRightToLine class="size-4 text-emerald-500" />
                  <span>Als <span class="font-medium">Nachher</span> setzen</span>
                </Button>
                <div class="bg-border my-1 h-px"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground h-9 w-full justify-start gap-1.5"
                  onclick={() => showFileAndClose(e.version)}
                >
                  <FileText class="size-4" />
                  <span>Datei öffnen</span>
                </Button>
              </div>
            </Popover.Content>
          </Popover.Root>
        {:else}
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  type="button"
                  class="absolute inline-flex size-4 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full p-0 transition-transform duration-150 hover:scale-110 focus-visible:outline-none active:scale-95"
                  style:left="{e.xPct}%"
                  style:top="{top}px"
                  aria-label={ariaLabel(e)}
                  aria-pressed={isSelected ? true : undefined}
                  onclick={() => onPlainClick(e)}
                >
                  {#if isSelected && ring}
                    <span
                      class={cn(
                        'pointer-events-none absolute -inset-2 rounded-full border-2',
                        ring
                      )}
                      aria-hidden="true"
                    ></span>
                  {/if}
                  <span
                    class={cn(
                      'ring-card relative size-3 rounded-full ring-2 transition-transform duration-150',
                      dotColorClass(e.type),
                      isFocused &&
                        !isSelected &&
                        'ring-offset-card scale-110 ring-current ring-offset-2'
                    )}
                    aria-hidden="true"
                  ></span>
                </button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="top" class="max-w-[min(100vw-2rem,20rem)] text-xs">
              <div class="text-foreground font-medium">{e.primaryLabel}</div>
              <div class="text-muted-foreground tabular-nums">
                {e.secondaryLabel}
              </div>
            </Tooltip.Content>
          </Tooltip.Root>
        {/if}
      {/each}
    </Tooltip.Provider>
  </div>
</div>
