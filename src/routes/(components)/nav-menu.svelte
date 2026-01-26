<script lang="ts">
  import { isProfessor, type User, type UserInfo } from '$lib/auth'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import { routesMap } from '$lib/routes.svelte'
  import ToggleTheme from './nav-toggle-theme.svelte'

  let { user, userInfo }: { user?: User; userInfo?: UserInfo } = $props()

  const { defaultRoutes, managerRoutes, pavRoutes, secondaryRoutes, scheduleRoutes } = routesMap

  const showMyModules = $derived.by(() => {
    if (userInfo) {
      // most direct check
      return userInfo.hasModulesToEdit
    }
    // fallback to user role
    if (!user) return false
    return isProfessor(user)
  })

  const showPAVSection = $derived(userInfo?.hasDirectorPrivileges)

  const showModuleReview = $derived(userInfo?.hasModuleReviewPrivileges)

  const rejectedReviews = $derived(userInfo?.rejectedReviews)

  const reviewsToApprove = $derived(userInfo?.reviewsToApprove)
</script>

<!-- main navigation -->
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

<!-- schedule section -->
<Sidebar.Separator />
<Sidebar.Group>
  <Sidebar.GroupLabel>Stundenplan (Experimentell)</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each Object.entries(scheduleRoutes) as [path, route] (path)}
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

<!-- module management section -->
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

<!-- PAV or SGL section -->
{#if showPAVSection}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>PAV oder SGL</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each Object.entries(pavRoutes) as [path, route] (path)}
        <!-- show module-approvals if user has module review privileges. always show study program -->
        {#if path === '/module-approvals' ? showModuleReview : true}
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
        {/if}
      {/each}
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- information section -->
<Sidebar.Group class="mt-auto">
  <Sidebar.GroupLabel>Information</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each Object.entries(secondaryRoutes) as [path, route] (path)}
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

<!-- settings section -->
<Sidebar.Group>
  <Sidebar.GroupLabel>Einstellungen</Sidebar.GroupLabel>
  <Sidebar.Menu>
    <ToggleTheme />
  </Sidebar.Menu>
</Sidebar.Group>
