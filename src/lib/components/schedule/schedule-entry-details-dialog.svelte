<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import type { FilterData } from '$lib/types/filter-data'
  import { fmtCourseType, type ScheduleEntry } from '$lib/types/schedule'
  import { DateFormatter } from '@internationalized/date'
  import { CalendarDays, Clock, ExternalLink, GraduationCap, MapPin, Users } from '@lucide/svelte'

  interface Props {
    onClose: () => void
    entry: ScheduleEntry
    studyPrograms: FilterData[]
  }

  let { onClose, entry, studyPrograms }: Props = $props()

  const dateFormatter = new DateFormatter('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const timeFormatter = new DateFormatter('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // svelte-ignore state_referenced_locally
  const start = new Date(entry.start)
  // svelte-ignore state_referenced_locally
  const end = new Date(entry.end)

  const startLabel = timeFormatter.format(start)
  const endLabel = timeFormatter.format(end)
  const dateLabel = dateFormatter.format(start)
  // svelte-ignore state_referenced_locally
  const roomLabel = entry.rooms.map((room) => room.abbrev).join(', ')
  // svelte-ignore state_referenced_locally
  const lecturerLabel = entry.lecturer.map(({ label }) => label).join(', ')
  // svelte-ignore state_referenced_locally
  const studyProgramLabels = entry.props.po
    .sort((a, b) => a.po.localeCompare(b.po))
    .map((po) => {
      const label = studyPrograms.find((sp) => sp.id === po.po)?.label ?? po.po
      return [label, po.mandatory]
    })

  function showModuleDetails() {
    goto(resolve(`/modules/[id=uuid]`, { id: entry.module }))
  }
</script>

<Dialog.Root
  open={true}
  onOpenChange={(open) => {
    if (!open) {
      onClose()
    }
  }}
>
  <Dialog.Content
    class="max-w-xl gap-0 p-0"
    showClose={false}
    onOpenAutoFocus={(e) => e.preventDefault()}
  >
    <div class="flex flex-col gap-5 p-6">
      <!-- Header -->
      <Dialog.Header>
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col gap-2">
            <Dialog.Title>{entry.moduleTitle}</Dialog.Title>
            <Dialog.Description>{fmtCourseType(entry.courseType)}</Dialog.Description>
          </div>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-muted-foreground hover:text-foreground size-8 shrink-0"
                onclick={showModuleDetails}
              >
                <ExternalLink class="size-4" />
                <span class="sr-only">Modul-Details anzeigen</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Modul-Details anzeigen</Tooltip.Content>
          </Tooltip.Root>
        </div>
      </Dialog.Header>

      <!-- Date & Time -->
      <div class="bg-muted/50 flex items-center gap-4 rounded-lg px-4 py-2.5 text-sm">
        <div class="flex items-center gap-2">
          <CalendarDays class="text-muted-foreground size-4" />
          <span class="font-medium">{dateLabel}</span>
        </div>
        <span class="text-muted-foreground/40">·</span>
        <div class="flex items-center gap-2">
          <Clock class="text-muted-foreground size-4" />
          <span class="font-medium">{startLabel} – {endLabel}</span>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <span
            class="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase"
          >
            <MapPin class="size-4" />
            Räume
          </span>
          <span class="text-sm">{roomLabel}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span
            class="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase"
          >
            <Users class="size-4" />
            Dozierende
          </span>
          <span class="text-sm">{lecturerLabel}</span>
        </div>
      </div>

      <!-- Study Programs -->
      {#if studyProgramLabels.length > 0}
        <div class="flex flex-col gap-2">
          <span
            class="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase"
          >
            <GraduationCap class="size-4" />
            Studiengänge
          </span>
          <div class="flex flex-wrap gap-2">
            {#each studyProgramLabels as [label, mandatory], i (i)}
              <Tooltip.Root>
                <Tooltip.Trigger>
                  <Badge variant={mandatory ? 'default' : 'secondary'}>
                    {label}
                  </Badge>
                </Tooltip.Trigger>
                <Tooltip.Content>{mandatory ? 'Pflichtmodul' : 'Wahlmodul'}</Tooltip.Content>
              </Tooltip.Root>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="border-t px-6 py-3">
      <Dialog.Footer class="gap-2 sm:justify-end">
        <Dialog.Close class={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Schließen
        </Dialog.Close>
      </Dialog.Footer>
    </div>
  </Dialog.Content>
</Dialog.Root>
