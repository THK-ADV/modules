<script lang="ts">
  // Note(BK6E1C): Structural and semantic twin of Note(BK6E1C) in
  // booking-details-dialog.svelte. Keep dialog chrome, date/time banner,
  // rooms/contacts grid, optional note, and footer in sync. Domain-specific
  // differences (module link, study programs, teaching-booking title/metadata) are expected.
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { isTeachingBooking, type TeachingBooking } from '$lib/types/booking'
  import { fmtCourseType, type ScheduleEntry } from '$lib/types/schedule'
  import type { StudyProgram } from '$lib/types/study-program'
  import { DateFormatter } from '@internationalized/date'
  import {
    CalendarDays,
    Clock,
    ExternalLink,
    GraduationCap,
    MapPin,
    StickyNote,
    Users
  } from '@lucide/svelte'
  import BookingMetadata from './booking-metadata.svelte'

  interface Props {
    onClose: () => void
    entry: ScheduleEntry | TeachingBooking
    studyPrograms: StudyProgram[]
    showBookingMetadata?: boolean
  }

  let { onClose, entry, studyPrograms, showBookingMetadata = true }: Props = $props()

  // Teaching bookings show their booking title; the module title moves to the description.
  const booking = $derived(isTeachingBooking(entry) ? entry : null)

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

  const start = $derived(new Date(entry.start))
  const end = $derived(new Date(entry.end))

  const startLabel = $derived(timeFormatter.format(start))
  const endLabel = $derived(timeFormatter.format(end))
  const dateLabel = $derived(dateFormatter.format(start))
  const roomLabel = $derived(
    entry.rooms
      .map((room) => room.abbrev)
      .sort()
      .join(', ')
  )
  const lecturerLabel = $derived(
    entry.lecturer
      .map(({ label }) => label)
      .sort()
      .join(', ')
  )
  const studyProgramLabels = $derived(
    [...entry.po]
      .sort((a, b) => a.po.localeCompare(b.po))
      .map((po) => {
        const sp = studyPrograms.find((sp) => {
          if (po.specialization != null) {
            return sp.po.id === po.po && sp.specialization?.id === po.specialization
          }
          return sp.po.id === po.po && sp.specialization == null
        })
        if (!sp) {
          return [po.po, po.po, po.mandatory]
        }
        const id = sp.specialization?.id ?? sp.po.id
        const name = sp.specialization ? `${sp.deLabel} ${sp.specialization.deLabel}` : sp.deLabel
        const label = `${name} · ${sp.degree.deLabel} · PO${sp.po.version}`
        return [id, label, po.mandatory]
      })
  )

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
            <Dialog.Title>{booking?.title ?? entry.moduleTitle}</Dialog.Title>
            <Dialog.Description>
              {fmtCourseType(entry.courseType)}{booking ? ` · ${entry.moduleTitle}` : ''}
            </Dialog.Description>
          </div>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:text-foreground size-8 shrink-0"
                  onclick={showModuleDetails}
                >
                  <ExternalLink class="size-4" />
                  <span class="sr-only">Modul-Details anzeigen</span>
                </Button>
              {/snippet}
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

      {#if booking?.note}
        <div class="flex flex-col gap-1">
          <span
            class="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase"
          >
            <StickyNote class="size-4" />
            Notiz
          </span>
          <p class="text-sm whitespace-pre-line">{booking.note}</p>
        </div>
      {/if}

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
            {#each studyProgramLabels as [id, label, mandatory] (id)}
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

      {#if booking && showBookingMetadata}
        <BookingMetadata createdBy={booking.createdBy} updatedAt={booking.updatedAt} />
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
