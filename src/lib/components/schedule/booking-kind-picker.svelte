<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { BOOKING_KIND_LABELS, bookingKindSchema, type BookingKind } from '$lib/schemas/booking'

  let {
    open,
    onSelect,
    onClose
  }: {
    open: boolean
    onSelect: (kind: BookingKind) => void
    onClose: () => void
  } = $props()
</script>

<Dialog.Root
  {open}
  onOpenChange={(open) => {
    if (!open) onClose()
  }}
>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Veranstaltungstyp wählen</Dialog.Title>
      <Dialog.Description>Welche Art von Buchung soll angelegt werden?</Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-2 py-2">
      {#each bookingKindSchema.options as kind (kind)}
        <Button variant="outline" class="justify-start" onclick={() => onSelect(kind)}>
          {BOOKING_KIND_LABELS[kind]}
        </Button>
      {/each}
    </div>
  </Dialog.Content>
</Dialog.Root>
