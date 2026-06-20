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
    Signature
  } from '@lucide/svelte'

  const mainRoutes = [
    { path: '/', icon: House },
    { path: '/modules', icon: Search },
    { path: '/module-catalogs', icon: Book },
    { path: '/exam-lists', icon: FileText }
  ] as const

  const secondaryRoutes = [
    { path: '/help', icon: LifeBuoy },
    { path: '/release-notes', icon: Megaphone }
  ] as const
</script>

<script lang="ts">
  import { isProfessor, type User, type UserInfo } from '$lib/auth'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'

  let { user, userInfo }: { user?: User; userInfo?: UserInfo } = $props()

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

  const showSchedulePlanningSection = $derived(userInfo?.hasSchedulePlanningPrivileges)
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

<!-- schedule section -->
<Sidebar.Separator />
<Sidebar.Group>
  <Sidebar.GroupLabel>Stundenplan (Experimentell)</Sidebar.GroupLabel>
  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <Sidebar.MenuButton>
        {#snippet child({ props })}
          <a href="/schedule" {...props}>
            <Calendar1 />
            <span>{routeLabels['/schedule']}</span>
          </a>
        {/snippet}
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
    {#if showSchedulePlanningSection}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href="/schedule-planning" {...props}>
              <CalendarCog />
              <span>{routeLabels['/schedule-planning']}</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    {/if}
  </Sidebar.Menu>
</Sidebar.Group>

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
