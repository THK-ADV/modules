<script lang="ts">
  import { isProfessor, type User, type UserInfo } from '$lib/auth'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { routesMap } from '$lib/routes.svelte'

  let { user, userInfo }: { user?: User; userInfo?: UserInfo } = $props()

  const {
    defaultRoutes,
    managerRoutes,
    pavRoutes,
    secondaryRoutes,
    scheduleRoutes,
    planningRoutes
  } = routesMap

  const showMyModules = $derived.by(() => {
    if (userInfo) {
      return userInfo.hasModulesToEdit
    }
    if (!user) return false
    return isProfessor(user)
  })

  const showPAVSection = $derived(userInfo?.hasDirectorPrivileges)

  const showModuleReview = $derived(userInfo?.hasModuleReviewPrivileges)

  const rejectedReviews = $derived(userInfo?.rejectedReviews)

  const reviewsToApprove = $derived(userInfo?.reviewsToApprove)

  const showPlanningSection = $derived(
    userInfo?.hasSchedulePlanningPrivileges || userInfo?.hasExamPlanningPrivileges
  )

  const canAccessSchedulePlanning = $derived(userInfo?.hasSchedulePlanningPrivileges ?? false)

  const canAccessExamPlanning = $derived(userInfo?.hasExamPlanningPrivileges ?? false)
</script>

<!-- main navigation -->
<Sidebar.Group>
  <Sidebar.Menu>
    {#each Object.entries(defaultRoutes) as [path, route] (path)}
      {@const isDisabled = path === '/module-catalogs'}
      <Sidebar.MenuItem>
        {#if isDisabled}
          <Tooltip.Root>
            <Tooltip.Trigger class="w-full">
              <Sidebar.MenuButton aria-disabled="true" class="opacity-50">
                {#snippet child({ props })}
                  <span {...props}>
                    <route.icon />
                    <span>{route.name}</span>
                  </span>
                {/snippet}
              </Sidebar.MenuButton>
            </Tooltip.Trigger>
            <Tooltip.Content>Demnächst verfügbar</Tooltip.Content>
          </Tooltip.Root>
        {:else}
          <Sidebar.MenuButton>
            {#snippet child({ props })}
              <a href={path} {...props}>
                <route.icon />
                <span>{route.name}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        {/if}
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

<!-- planning section -->
{#if showPlanningSection}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>Planung</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each Object.entries(planningRoutes) as [path, route] (path)}
        {@const isExamPlanning = path === '/planning/exam'}
        {@const enabled = isExamPlanning ? canAccessExamPlanning : canAccessSchedulePlanning}
        <Sidebar.MenuItem>
          {#if enabled}
            <Sidebar.MenuButton>
              {#snippet child({ props })}
                <a href={path} {...props}>
                  <route.icon />
                  <span>{route.name}</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          {:else}
            <Tooltip.Root>
              <Tooltip.Trigger class="w-full">
                <Sidebar.MenuButton aria-disabled="true" class="opacity-50">
                  {#snippet child({ props })}
                    <span {...props}>
                      <route.icon />
                      <span>{route.name}</span>
                    </span>
                  {/snippet}
                </Sidebar.MenuButton>
              </Tooltip.Trigger>
              <Tooltip.Content>Demnächst verfügbar</Tooltip.Content>
            </Tooltip.Root>
          {/if}
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

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
