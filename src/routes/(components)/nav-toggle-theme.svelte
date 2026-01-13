<script lang="ts">
  import { Sun, Moon } from '@lucide/svelte'

  import { mode, toggleMode } from 'mode-watcher'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'

  const toggleModeText = $derived(mode.current === 'dark' ? 'Light' : 'Dark')
</script>

<Sidebar.MenuItem>
  <Sidebar.MenuButton onclick={toggleMode}>
    <span class="relative flex items-center">
      <Moon class="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Sun class="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </span>
    <span>{toggleModeText}</span>
  </Sidebar.MenuButton>
</Sidebar.MenuItem>
