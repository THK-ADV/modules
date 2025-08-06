<script lang="ts">
  import SunIcon from '@lucide/svelte/icons/sun'
  import MoonIcon from '@lucide/svelte/icons/moon'

  import { setMode, mode, toggleMode } from 'mode-watcher'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <!-- Collapsed view: icon button only -->
    <div class="hidden group-data-[collapsible=icon]:block group-data-[collapsible=icon]:w-full">
      <Button onclick={toggleMode} variant="ghost" size="icon" class="mx-auto h-8 w-8">
        <MoonIcon
          class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 !transition-all dark:-rotate-90 dark:scale-0"
        />
        <SunIcon
          class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 !transition-all dark:rotate-0 dark:scale-100"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </div>

    <!-- Expanded view: tabs with text -->
    <div class="group-data-[collapsible=icon]:hidden">
      <Tabs.Root value={$mode} onValueChange={(value) => setMode(value)}>
        <Tabs.List class="grid w-full grid-cols-2 rounded-lg">
          <Tabs.Trigger value="light" class="flex items-center gap-2 rounded-lg">
            <SunIcon class="h-4 w-4" />
            <span>Light</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="dark" class="flex items-center gap-2 rounded-lg">
            <MoonIcon class="h-4 w-4" />
            <span>Dark</span>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
  </Sidebar.MenuItem>
</Sidebar.Menu>
