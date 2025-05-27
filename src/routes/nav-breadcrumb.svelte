<script lang="ts">
  import { page } from '$app/state'
  import * as Breadcrumb from '$lib/components/ui/breadcrumb'
  import { routesMap } from '$lib/routes.svelte'

  let { allRoutes } = routesMap

  let breadcrumbItems = $state([{ path: '/', name: 'Home', id: 'home', clickable: true }])

  $effect(() => {
    const path = page.url.pathname
    const items = [{ path: '/', name: 'Home', id: 'home', clickable: true }]

    if (path !== '/') {
      const pathSegments = path.split('/')
      pathSegments.shift()

      let selectedModule = routesMap.selectedModule
      let firstUnClickable = false

      for (const id of pathSegments) {
        const path = `/${id}`
        let name
        let clickable
        if (path in allRoutes) {
          name = allRoutes[path].name
          clickable = true
        } else if (id === selectedModule?.id) {
          name = selectedModule.title
          clickable = false
        } else {
          name = '???'
          clickable = false
        }

        if (!firstUnClickable) {
          items.push({ path, name, id, clickable })
        }

        /*	skips breadcrumbs as soon as one gets not clickable.
					 	navigation gets broken otherwise */
        if (!clickable) {
          firstUnClickable = true
        }
      }
    }

    breadcrumbItems = items
  })
</script>

<Breadcrumb.Root>
  <Breadcrumb.List>
    {#each breadcrumbItems as item, i (item.id)}
      <!--			<Breadcrumb.Item class="hidden md:block">-->
      <Breadcrumb.Item>
        {#if i === breadcrumbItems.length - 1}
          <Breadcrumb.Page>{item.name}</Breadcrumb.Page>
        {:else if item.clickable}
          <Breadcrumb.Link href={item.path}>{item.name}</Breadcrumb.Link>
        {:else}
          <Breadcrumb.Page>{item.name}</Breadcrumb.Page>
        {/if}
      </Breadcrumb.Item>
      {#if i < breadcrumbItems.length - 1}
        <!--				<Breadcrumb.Separator class="hidden md:block" />-->
        <Breadcrumb.Separator />
      {/if}
    {/each}
  </Breadcrumb.List>
</Breadcrumb.Root>
