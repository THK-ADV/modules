<script lang="ts" module>
  import { resolve } from '$app/paths'
  import { CORE_DATA_ROUTE_ID, routeLabels } from '$lib/routes'
  import {
    Book,
    CalendarClock,
    CalendarCog,
    CalendarDays,
    CalendarPlus,
    ChevronRight,
    ClipboardList,
    Database,
    FileText,
    GitBranch,
    GitPullRequestArrow,
    GraduationCap,
    House,
    LifeBuoy,
    Megaphone,
    Pencil,
    Search,
    Shield,
    Signature,
    UserRoundCheck,
    type IconProps
  } from '@lucide/svelte'
  import { coreDataEntities } from '$lib/core-data/entities'
  import type { Component } from 'svelte'

  type NavPath = Exclude<keyof typeof routeLabels, `${string}[${string}`>

  const mainRoutes = [
    { path: '/', icon: House },
    { path: '/modules', icon: Search },
    { path: '/module-catalogs', icon: Book },
    { path: '/exam-lists', icon: FileText },
    { path: '/schedule', icon: CalendarDays }
  ] as const

  const gitRoutes = [
    { path: '/git/branches', icon: GitBranch },
    { path: '/git/publication', icon: GitPullRequestArrow }
  ] as const

  const secondaryRoutes = [
    { path: '/help', icon: LifeBuoy },
    { path: '/release-notes', icon: Megaphone }
  ] as const
</script>

<script lang="ts">
  import { afterNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import { isProfessor, type User } from '$lib/auth'
  import type { UserInfo } from '$lib/schemas/user-info'
  import * as Collapsible from '$lib/components/ui/collapsible/index.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js'

  let { user, userInfo }: { user?: User; userInfo?: UserInfo } = $props()

  const sidebar = useSidebar()

  let coreDataOpen = $state(false)

  afterNavigate(() => {
    if (isActive('/core-data')) coreDataOpen = true
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(false)
    }
  })

  function current(path: string): 'page' | 'location' | undefined {
    const pathname = page.url.pathname
    if (pathname === path) return 'page'
    if (path !== '/' && pathname.startsWith(path + '/')) return 'location'
  }

  function isActive(path: string): boolean {
    return current(path) !== undefined
  }

  const showMyModules = $derived.by(() => {
    if (userInfo) {
      return userInfo.hasModulesToEdit
    }
    if (!user) return false
    return isProfessor(user)
  })

  const showScheduleSection = $derived(
    userInfo?.hasSchedulePlanningViewPrivileges || userInfo?.hasScheduleBookingPrivileges
  )
</script>

{#snippet navButton(path: NavPath, Icon: Component<IconProps>, active = isActive(path))}
  <Sidebar.MenuButton isActive={active} aria-current={active ? current(path) : undefined}>
    {#snippet child({ props })}
      <a href={resolve(path)} {...props}>
        <Icon />
        <span>{routeLabels[path]}</span>
      </a>
    {/snippet}
  </Sidebar.MenuButton>
{/snippet}

<!-- main navigation -->
<Sidebar.Group>
  <Sidebar.Menu>
    {#each mainRoutes as route (route.path)}
      <Sidebar.MenuItem>
        {@render navButton(route.path, route.icon)}
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>

<!-- schedule section -->
{#if showScheduleSection}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>Veranstaltungen</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#if userInfo?.hasSchedulePlanningViewPrivileges}
        <Sidebar.MenuItem>
          {@render navButton('/planning/schedule', CalendarCog)}
        </Sidebar.MenuItem>
      {/if}
      {#if userInfo?.hasScheduleBookingPrivileges && !userInfo.hasSchedulePlanningPrivileges}
        <Sidebar.MenuItem>
          {@render navButton('/planning/bookings', CalendarPlus)}
        </Sidebar.MenuItem>
      {/if}
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- exams section -->
{#if userInfo}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>Prüfungen</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#if userInfo.hasExamPlanningPrivileges}
        <Sidebar.MenuItem>
          {@render navButton('/planning/exam/exams', ClipboardList)}
        </Sidebar.MenuItem>
      {/if}
      {#if userInfo.hasExamPlanningViewPrivileges}
        <Sidebar.MenuItem>
          {@render navButton(
            '/planning/exam',
            CalendarClock,
            isActive('/planning/exam') && !isActive('/planning/exam/exams')
          )}
        </Sidebar.MenuItem>
      {/if}
      <Sidebar.MenuItem>
        {@render navButton('/invigilations', UserRoundCheck)}
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- module management section -->
{#if showMyModules}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>Module</Sidebar.GroupLabel>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        {@render navButton('/my-modules', Pencil)}
        {#if userInfo?.rejectedReviews}
          <Sidebar.MenuBadge>{userInfo.rejectedReviews}</Sidebar.MenuBadge>
        {/if}
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- PAV or SGL section -->
{#if userInfo?.hasDirectorPrivileges}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>PAV oder SGL</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#if userInfo.hasModuleReviewPrivileges}
        <Sidebar.MenuItem>
          {@render navButton('/module-approvals', Signature)}
          {#if userInfo.reviewsToApprove}
            <Sidebar.MenuBadge>{userInfo.reviewsToApprove}</Sidebar.MenuBadge>
          {/if}
        </Sidebar.MenuItem>
      {/if}
      <Sidebar.MenuItem>
        {@render navButton('/studyprogram', GraduationCap)}
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- administration section -->
{#if userInfo?.hasCoreDataEditPrivileges}
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>Administration</Sidebar.GroupLabel>
    <Sidebar.Menu>
      <Collapsible.Root
        bind:open={coreDataOpen}
        onOpenChange={(open) => {
          coreDataOpen = open || (sidebar.state === 'collapsed' && !sidebar.isMobile)
          if (coreDataOpen && !sidebar.isMobile) sidebar.setOpen(true)
        }}
        class="group/collapsible"
      >
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            <Collapsible.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuButton {...props} isActive={isActive('/core-data')}>
                  <Database />
                  <span>{routeLabels['/core-data']}</span>
                  <ChevronRight
                    class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  />
                </Sidebar.MenuButton>
              {/snippet}
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Sidebar.MenuSub>
                {#each coreDataEntities as entity (entity.key)}
                  {@const path = resolve(CORE_DATA_ROUTE_ID, { entity: entity.key })}
                  <Sidebar.MenuSubItem>
                    <Sidebar.MenuSubButton isActive={isActive(path)} aria-current={current(path)}>
                      {#snippet child({ props })}
                        <a href={path} {...props}><span>{entity.label}</span></a>
                      {/snippet}
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                {/each}
              </Sidebar.MenuSub>
            </Collapsible.Content>
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
      <Sidebar.MenuItem>
        {@render navButton('/permissions', Shield)}
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Group>

  <!-- git section -->
  <Sidebar.Separator />
  <Sidebar.Group>
    <Sidebar.GroupLabel>Git</Sidebar.GroupLabel>
    <Sidebar.Menu>
      {#each gitRoutes as route (route.path)}
        <Sidebar.MenuItem>
          {@render navButton(route.path, route.icon)}
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.Group>
{/if}

<!-- information section -->
<Sidebar.Group class="mt-auto">
  <Sidebar.GroupLabel>Information</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each secondaryRoutes as route (route.path)}
      <Sidebar.MenuItem>
        {@render navButton(route.path, route.icon)}
      </Sidebar.MenuItem>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
