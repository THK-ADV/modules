<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { resolve } from '$app/paths'

  let { id, title, status }: { id: string; title: string; status: string } = $props()
</script>

<div class="flex items-center gap-2">
  {#if status === 'inactive'}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <span
            class="cursor-help rounded border border-red-200 bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-100"
          >
            Inaktiv
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Das Modul wird aktuell nicht angeboten.</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {/if}
  <a href={resolve('/modules/[id=uuid]', { id })}>{title}</a>
</div>
