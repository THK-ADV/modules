<script lang="ts">
  import { isProfessor, type User, type UserInfo } from '$lib/auth'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import { routesMap } from '$lib/routes.svelte'

  let { user, userInfo }: { user?: User; userInfo?: UserInfo } = $props()

  const { defaultRoutes, managerRoutes, pavRoutes } = routesMap

  const showMyModules = $derived.by(() => {
    if (!user) return false
    return isProfessor(user) || userInfo?.hasModulesToEdit
  })

  const showPAVSection = $derived(userInfo?.hasUniversityRole)

  const rejectedReviews = $derived(userInfo?.rejectedReviews)

  const reviewsToApprove = $derived(userInfo?.reviewsToApprove)
</script>

<Sidebar.Group>
  <Sidebar.Menu>
    {#each Object.entries(defaultRoutes) as [path, route] (path)}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href={path} {...props}>
              <route.icon />
              <span>{route.name}</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>

{#if showMyModules}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>Dozent:in</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each Object.entries(managerRoutes) as [path, route] (path)}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            {#snippet child({ props })}
              <a href={path} {...props}>
                <route.icon />
                <span>{route.name}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
          {#if rejectedReviews}
            <Sidebar.MenuBadge>{rejectedReviews}</Sidebar.MenuBadge>
          {/if}
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

{#if showPAVSection}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>PAV oder SGL</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each Object.entries(pavRoutes) as [path, route] (path)}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            {#snippet child({ props })}
              <a href={path} {...props}>
                <route.icon />
                <span>{route.name}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
          {#if path === '/module-approvals' && reviewsToApprove}
            <Sidebar.MenuBadge>{reviewsToApprove}</Sidebar.MenuBadge>
          {/if}
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}
