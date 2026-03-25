<script lang="ts">
  import { resolve } from '$app/paths'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { Ban } from '@lucide/svelte'

  let { id, title, abbrev, status }: { id: string; title: string; abbrev: string; status: string } =
    $props()
</script>

<div class="flex items-center gap-2">
  {#if status === 'inactive'}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <span title="Inaktiv">
            <Ban class="text-amber-600 dark:text-amber-400" size={16} aria-label="Inaktiv" />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Das Modul wird aktuell nicht angeboten.</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {/if}
  <a href={resolve('/modules/[id=uuid]', { id })} title={`${title} (${abbrev})`}>
    <span class="md:hidden">{abbrev}</span>
    <span class="hidden md:inline">{title} ({abbrev})</span>
  </a>
</div>
