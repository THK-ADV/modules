<script lang="ts" module>
  import { routeLabels } from '$lib/routes'
  import {
    Book,
    Calendar1,
    CalendarCog,
    FileText,
    GraduationCap,
    House,
    LifeBuoy,
    Megaphone,
    Pencil,
    Search,
    Signature,
    CalendarClock
  } from '@lucide/svelte'

  const mainRoutes = [
    { path: '/', icon: House },
    { path: '/modules', icon: Search },
    { path: '/module-catalogs', icon: Book },
    { path: '/exam-lists', icon: FileText },
    { path: '/schedule', icon: Calendar1 }
  ] as const

  const secondaryRoutes = [
    { path: '/help', icon: LifeBuoy },
    { path: '/release-notes', icon: Megaphone }
  ] as const
</script>

<script lang="ts">
  import { isProfessor, type User, type UserInfo } from '$lib/auth'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'

  let { user, userInfo }: { user?: User; userInfo?: UserInfo } = $props()

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
</script>

<!-- main navigation -->
<Sidebar.Group>
  <Sidebar.Menu>
    {#each mainRoutes as route (route.path)}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href={route.path} {...props}>
              <route.icon />
              <span>{routeLabels[route.path]}</span>
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
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href="/planning/schedule" {...props}>
              <CalendarCog />
              <span>{routeLabels['/planning/schedule']}</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Tooltip.Root>
          <Tooltip.Trigger class="w-full">
            <Sidebar.MenuButton aria-disabled="true" class="opacity-50">
              {#snippet child({ props })}
                <span {...props}>
                  <CalendarClock />
                  <span>{routeLabels['/planning/exam']}</span>
                </span>
              {/snippet}
            </Sidebar.MenuButton>
          </Tooltip.Trigger>
          <Tooltip.Content>Demnächst verfügbar</Tooltip.Content>
        </Tooltip.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- module management section -->
{#if showMyModules}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>Dozent:in</Sidebar.GroupLabel>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href="/my-modules" {...props}>
              <Pencil />
              <span>{routeLabels['/my-modules']}</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
        {#if rejectedReviews}
          <Sidebar.MenuBadge>{rejectedReviews}</Sidebar.MenuBadge>
        {/if}
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- PAV or SGL section -->
{#if showPAVSection}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>PAV oder SGL</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#if showModuleReview}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            {#snippet child({ props })}
              <a href="/module-approvals" {...props}>
                <Signature />
                <span>{routeLabels['/module-approvals']}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
          {#if reviewsToApprove}
            <Sidebar.MenuBadge>{reviewsToApprove}</Sidebar.MenuBadge>
          {/if}
        </Sidebar.MenuItem>
      {/if}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href="/studyprogram" {...props}>
              <GraduationCap />
              <span>{routeLabels['/studyprogram']}</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- information section -->
<Sidebar.Group class="mt-auto">
  <Sidebar.GroupLabel>Information</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each secondaryRoutes as route (route.path)}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href={route.path} {...props}>
              <route.icon />
              <span>{routeLabels[route.path]}</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
