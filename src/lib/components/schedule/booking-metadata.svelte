<script lang="ts">
  import type { BookingMetadata } from '$lib/types/booking'
  import { fmtDateTime } from '$lib/formats'
  import { History, UserRound } from '@lucide/svelte'

  let { createdBy, updatedAt }: BookingMetadata = $props()
</script>

<div
  class="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] leading-4"
  aria-label="Buchungsmetadaten"
>
  <span class="flex items-center gap-1.5">
    <UserRound class="size-3" aria-hidden="true" />
    Erstellt von <span class="text-foreground/75 font-medium">{createdBy.label}</span>
  </span>
  <span class="flex items-center gap-1.5">
    <History class="size-3" aria-hidden="true" />
    Zuletzt bearbeitet
    <span class="text-foreground/75 font-medium">{fmtDateTime(updatedAt)}</span>
  </span>
</div>
