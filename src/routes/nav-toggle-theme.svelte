<script lang="ts">
  import SunIcon from '@lucide/svelte/icons/sun'
  import MoonIcon from '@lucide/svelte/icons/moon'

  import { mode, toggleMode } from 'mode-watcher'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
</script>

<Sidebar.MenuItem>
  <Sidebar.MenuButton onclick={toggleMode}>
    <span class="relative flex items-center">
      <MoonIcon class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <SunIcon
        class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
    </span>
    <span>{$mode === 'dark' ? 'Light' : 'Dark'}</span>
  </Sidebar.MenuButton>
</Sidebar.MenuItem>
