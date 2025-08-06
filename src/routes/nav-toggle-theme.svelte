<script lang="ts">
  import SunIcon from '@lucide/svelte/icons/sun'
  import MoonIcon from '@lucide/svelte/icons/moon'

  import { setMode, mode } from 'mode-watcher'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <Tabs.Root value={$mode} onValueChange={(value) => setMode(value)}>
      <Tabs.List class="grid h-9 w-full grid-cols-2 rounded-lg">
        <Tabs.Trigger value="light" class="flex h-7 items-center gap-2 rounded-lg">
          <SunIcon class="h-4 w-4" />
          <span>Light</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="dark" class="flex h-7 items-center gap-2 rounded-lg">
          <MoonIcon class="h-4 w-4" />
          <span>Dark</span>
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
