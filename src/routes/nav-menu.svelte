<script lang="ts">
	import { page } from '$app/state'
	import * as Sidebar from '$lib/components/ui/sidebar/index.js'
	import { isEmployee, type User } from '$lib/auth'
	import { routesMap } from '$lib/routes.svelte'

	const { defaultRoutes, managerRoutes, pavRoutes } = routesMap

	let user: User | undefined = page.data.user

	let isEmp = $derived(user ? isEmployee(user) : false)
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
				<!-- <Sidebar.MenuBadge>1</Sidebar.MenuBadge> -->
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>

{#if isEmp}
	<Sidebar.Separator />
	<Sidebar.Group>
		<Sidebar.GroupLabel>Dozent</Sidebar.GroupLabel>
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
					<!-- <Sidebar.MenuBadge>1</Sidebar.MenuBadge> -->
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.Group>
{/if}

{#if isEmp}
	<Sidebar.Separator />
	<Sidebar.Group>
		<Sidebar.GroupLabel>PAV</Sidebar.GroupLabel>
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
					<!-- <Sidebar.MenuBadge>1</Sidebar.MenuBadge> -->
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.Group>
{/if}
