<script lang="ts">
  import { resolve } from '$app/paths'
  import InactiveModuleIcon from '$lib/components/inactive-module-icon.svelte'

  let { id, title, abbrev, status }: { id: string; title: string; abbrev: string; status: string } =
    $props()
</script>

<div class="flex items-center gap-2">
  {#if status === 'inactive'}
    <InactiveModuleIcon />
  {/if}
  <a href={resolve('/modules/[id=uuid]', { id })} title={`${title} (${abbrev})`}>
    <span class="md:hidden">{abbrev}</span>
    <span class="hidden md:inline">{title} ({abbrev})</span>
  </a>
</div>
