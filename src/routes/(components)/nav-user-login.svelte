<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import type { User, UserInfo } from '$lib/auth'
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import { ChevronsUpDown, LogOut, LogIn } from '@lucide/svelte'

  let { user, userInfo }: { user?: User; userInfo?: UserInfo } = $props()

  const abbreviation = $derived.by(() => {
    if (!user) return ''
    if (userInfo) {
      return userInfo.person.abbreviation
    }
    return user.firstname.charAt(0).toUpperCase() + user.lastname.charAt(0).toUpperCase()
  })

  async function login() {
    await goto(resolve('/login'))
  }

  async function logout() {
    await goto(resolve('/logout'))
  }
</script>

{#if user}
  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Sidebar.MenuButton
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              {...props}
            >
              <Avatar.Root class="size-8 rounded-lg">
                <Avatar.Fallback class="rounded-lg">{abbreviation}</Avatar.Fallback>
              </Avatar.Root>
              <p class="grid flex-1 truncate text-left text-sm leading-tight font-semibold">
                {user.firstname}
                {user.lastname}
              </p>
              <ChevronsUpDown class="ml-auto size-4" />
            </Sidebar.MenuButton>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <DropdownMenu.Item onclick={logout}>
            <LogOut />
            Ausloggen
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Sidebar.MenuItem>
  </Sidebar.Menu>
{:else}
  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <Sidebar.MenuButton
        onclick={login}
        class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground h-12 justify-center px-4 py-3 font-medium group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!"
      >
        <LogIn />
        <span>Einloggen</span>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  </Sidebar.Menu>
{/if}
