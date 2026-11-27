<script lang="ts">
  import type { User } from '$lib/auth'
  import type { UserInfo } from '$lib/schemas/user-info'
  import TeamSwitcher from '$lib/components/team-switcher.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import type { ComponentProps } from 'svelte'
  import NavMenu from './nav-menu.svelte'
  import NavUserLogin from './nav-user-login.svelte'

  let {
    ref = $bindable(null),
    collapsible = 'icon',
    user,
    userInfo,
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> & { user?: User; userInfo?: UserInfo } = $props()
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
  <Sidebar.Header>
    <TeamSwitcher />
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMenu {user} {userInfo} />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUserLogin {user} {userInfo} />
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
