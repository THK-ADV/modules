<script lang="ts">
  import { Separator } from '$lib/components/ui/separator/index.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import { setSidebarState } from '$lib/stores/sidebar-state'
  import { ModeWatcher } from 'mode-watcher'
  import '../app.css'
  import type { LayoutProps } from './$types'
  import AppSidebar from './(components)/app-sidebar.svelte'
  import NavBreadcrumb from './(components)/nav-breadcrumb.svelte'

  let { children, data }: LayoutProps = $props()

  function sideBarOpenChange(open: boolean) {
    setSidebarState(open, document)
  }
</script>

<ModeWatcher />

<Sidebar.Provider open={data.sidebarOpen} onOpenChange={sideBarOpenChange}>
  <AppSidebar user={data.user} userInfo={data.userInfo} />
  <Sidebar.Inset>
    <header
      class="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear md:h-16 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
    >
      <div class="flex items-center gap-2 px-3 md:px-4">
        <Sidebar.Trigger class="-ml-1 size-10 [&>svg]:size-5 md:size-7 md:[&>svg]:size-4" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <NavBreadcrumb />
      </div>
    </header>
    <main class="flex-1 px-3 py-4 md:px-4 md:py-6">
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
