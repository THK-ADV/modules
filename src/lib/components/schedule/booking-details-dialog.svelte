<script lang="ts">
  // Note(BK6E1C): Structural and semantic twin of Note(BK6E1C) in
  // schedule-entry-details-dialog.svelte. Keep dialog chrome, date/time banner,
  // rooms/contacts grid, optional note, and footer in sync. Domain-specific
  // differences (booking kind vs module/course type, no study programs/metadata) are expected.
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { BOOKING_KIND_LABELS, type CampusBooking } from '$lib/types/booking'
  import { DateFormatter } from '@internationalized/date'
  import { CalendarDays, Clock, MapPin, StickyNote, Users } from '@lucide/svelte'

  interface Props {
    onClose: () => void
    booking: CampusBooking
  }

  let { onClose, booking }: Props = $props()

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

  const start = $derived(new Date(booking.start))
  const end = $derived(new Date(booking.end))
  const roomLabel = $derived(
    booking.rooms
      .map((room) => room.abbrev)
      .sort()
      .join(', ')
  )
  const contactLabel = $derived(
    booking.lecturer
      .map(({ label }) => label)
      .sort()
      .join(', ')
  )
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
      <Dialog.Header>
        <Dialog.Title>{booking.title}</Dialog.Title>
        <Dialog.Description>{BOOKING_KIND_LABELS[booking.kind]}</Dialog.Description>
      </Dialog.Header>

      <div class="bg-muted/50 flex items-center gap-4 rounded-lg px-4 py-2.5 text-sm">
        <div class="flex items-center gap-2">
          <CalendarDays class="text-muted-foreground size-4" />
          <span class="font-medium">{dateFormatter.format(start)}</span>
        </div>
        <span class="text-muted-foreground/40">·</span>
        <div class="flex items-center gap-2">
          <Clock class="text-muted-foreground size-4" />
          <span class="font-medium"
            >{timeFormatter.format(start)} – {timeFormatter.format(end)}</span
          >
        </div>
      </div>

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
            Ansprechpersonen
          </span>
          <span class="text-sm">{contactLabel}</span>
        </div>
      </div>

      {#if booking.note}
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
    </div>

    <div class="border-t px-6 py-3">
      <Dialog.Footer class="gap-2 sm:justify-end">
        <Dialog.Close class={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Schließen
        </Dialog.Close>
      </Dialog.Footer>
    </div>
  </Dialog.Content>
</Dialog.Root>
