<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import { Input } from '$lib/components/ui/input'
  import * as ScrollArea from '$lib/components/ui/scroll-area/index.js'
  import { fmtCourseType, type ScheduleEntry } from '$lib/types/schedule'
  import { BookOpen, FileText, GripVertical, Plus, Search, User } from '@lucide/svelte'

  let {
    entries = [],
    onEntryClick,
    onNewEntryClick
  }: {
    entries: ScheduleEntry[]
    onEntryClick: (entry: ScheduleEntry) => void
    onNewEntryClick: () => void
  } = $props()

  let searchQuery = $state('')

  const displayedDrafts = $derived.by(() => {
    const query = searchQuery.toLocaleLowerCase()
    if (!query) return entries
    return entries.filter(({ moduleTitle }) => moduleTitle.toLocaleLowerCase().includes(query))
  })

  function handleDragStart(event: DragEvent, entry: ScheduleEntry) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(entry))
      event.dataTransfer.effectAllowed = 'move'
    }
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <div class="border-border flex items-center justify-between border-b px-4 py-3">
    <div class="flex items-center gap-2">
      <FileText class="text-muted-foreground size-4" />
      <h3 class="text-sm font-semibold">Entwürfe</h3>
      <Badge variant="secondary" class="ml-1 h-5 px-1.5 text-xs">
        {entries.length}
      </Badge>
    </div>
    <Button variant="ghost" size="sm" class="size-8" onclick={onNewEntryClick}>
      <Plus class="size-4" />
      <span class="sr-only">Neuer Entwurf</span>
    </Button>
  </div>

  <!-- Search -->
  <div class="border-border border-b p-3">
    <div class="relative">
      <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        placeholder="Entwürfe durchsuchen…"
        class="h-8 pl-8 text-sm"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Draft List -->
  <ScrollArea.Root class="flex-1">
    <div class="space-y-2 p-3">
      {#each displayedDrafts as draft (draft.id)}
        <button
          type="button"
          draggable="true"
          ondragstart={(e) => handleDragStart(e, draft)}
          onclick={() => onEntryClick(draft)}
          class="bg-card hover:bg-accent group flex w-full cursor-grab items-start gap-2 rounded-lg border p-3 text-left transition-colors active:cursor-grabbing"
        >
          <div
            class="text-muted-foreground mt-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <GripVertical class="size-4" />
          </div>
          <div class="min-w-0 flex-1 space-y-2">
            <!-- Title -->
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium">{draft.moduleAbbrev}</span>
                <Badge variant="outline" class="text-[10px]">
                  {fmtCourseType(draft.courseType)}
                </Badge>
              </div>
              <p class="text-muted-foreground mt-0.5 truncate text-xs">{draft.moduleTitle}</p>
            </div>

            <!-- Meta info -->
            <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {#if draft.moduleManagement}
                <div class="flex items-center gap-1">
                  <User class="size-3" />
                  <span class="max-w-24 truncate">
                    {draft.moduleManagement.map(({ label }) => label).join(', ')}
                  </span>
                </div>
              {/if}
              {#if draft.props.po}
                <div class="flex items-center gap-1">
                  <BookOpen class="size-3" />
                  <span>{draft.props.po.length} Studiengänge</span>
                </div>
              {/if}
            </div>
          </div>
        </button>
      {:else}
        <Empty.Root class="min-h-[220px] border border-border/70 bg-background/80 py-6">
          <Empty.Header class="gap-2">
            <Empty.Media variant="icon" class="size-12 rounded-xl bg-muted text-muted-foreground">
              <FileText class="size-6" />
            </Empty.Media>
            <Empty.Title class="text-base font-semibold">Keine Entwürfe vorhanden</Empty.Title>
            <Empty.Description class="max-w-xs text-xs">
              Erstelle einen neuen Eintrag oder verschiebe bestehende Einträge hierher.
            </Empty.Description>
          </Empty.Header>
          <Empty.Content class="mt-1">
            <Button size="sm" onclick={onNewEntryClick}>
              <Plus class="size-4" />
              Eintrag hinzufügen
            </Button>
          </Empty.Content>
        </Empty.Root>
      {/each}
    </div>
  </ScrollArea.Root>

  <!-- Footer hint -->
  <div class="border-border bg-muted/50 border-t px-4 py-2">
    <p class="text-muted-foreground text-center text-xs">
      Ziehen Sie Entwürfe in den Kalender, um sie zu planen
    </p>
  </div>
</div>
