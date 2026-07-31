<script lang="ts">
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'

  let activeApp = $state({
    name: 'Modulverwaltung',
    plan: 'TH Köln'
  })

  const sidebar = useSidebar()
  const isSidebarCollapsed = $derived(sidebar.state === 'collapsed')
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <a href="/">
      <Sidebar.MenuButton
        size="lg"
        class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        {#if isSidebarCollapsed}
          <div class="flex w-full items-center justify-center">
            <span class="text-lg font-bold">MV</span>
          </div>
        {:else}
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">
              {activeApp.name}
            </span>
            <span class="truncate text-xs">{activeApp.plan}</span>
          </div>
        {/if}
      </Sidebar.MenuButton>
    </a>
  </Sidebar.MenuItem>
</Sidebar.Menu>
