<script lang="ts">
  import AppSidebar from '../../routes/app-sidebar.svelte'
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js'
  import { Separator } from '$lib/components/ui/separator/index.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header
      class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
    >
      <div class="flex items-center gap-2 px-4">
        <Sidebar.Trigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item class="hidden md:block">
              <Breadcrumb.Link href="#">Building Your Application</Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator class="hidden md:block" />
            <Breadcrumb.Item>
              <Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div class="grid auto-rows-min gap-4 md:grid-cols-3">
        <div class="aspect-video rounded-xl bg-muted/50"></div>
        <div class="aspect-video rounded-xl bg-muted/50"></div>
        <div class="aspect-video rounded-xl bg-muted/50"></div>
      </div>
      <div class="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min"></div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
