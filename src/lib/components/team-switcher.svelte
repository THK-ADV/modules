<script lang="ts">
  import { resolve } from '$app/paths'
  import MateLogo from '$lib/components/mate-logo.svelte'
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'

  const sidebar = useSidebar()
  const isSidebarCollapsed = $derived(sidebar.state === 'collapsed' && !sidebar.isMobile)
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Sidebar.MenuButton size="lg" class="h-16">
      {#snippet tooltipContent()}
        MATE – Startseite
      {/snippet}
      {#snippet child({ props })}
        <a {...props} href={resolve('/')} aria-label="MATE – Startseite">
          {#if isSidebarCollapsed}
            <MateLogo variant="compact" alt="" class="w-8" />
          {:else}
            <MateLogo variant="landscape" alt="" class="h-12 w-full" />
          {/if}
        </a>
      {/snippet}
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
</Sidebar.Menu>
