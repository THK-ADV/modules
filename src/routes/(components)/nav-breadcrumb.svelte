<script lang="ts">
  import { page } from '$app/state'
  import * as Breadcrumb from '$lib/components/ui/breadcrumb'
  import { createBreadcrumbItems } from '$lib/routes'

  const breadcrumbItems = $derived(
    createBreadcrumbItems(page.route.id, page.url.pathname, page.data.breadcrumbLabels)
  )
</script>

<Breadcrumb.Root>
  <Breadcrumb.List>
    {#each breadcrumbItems as item, i (item.href)}
      <Breadcrumb.Item>
        {#if i === breadcrumbItems.length - 1}
          <Breadcrumb.Page>{item.label}</Breadcrumb.Page>
        {:else}
          <Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
        {/if}
      </Breadcrumb.Item>
      {#if i < breadcrumbItems.length - 1}
        <Breadcrumb.Separator />
      {/if}
    {/each}
  </Breadcrumb.List>
</Breadcrumb.Root>
