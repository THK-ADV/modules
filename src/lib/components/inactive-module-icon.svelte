<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { Ban } from '@lucide/svelte'
</script>

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
